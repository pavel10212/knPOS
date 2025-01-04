import { create } from "zustand";
import io from 'socket.io-client';

const SOCKET_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

export const useOrderStore = create((set, get) => ({
  // State
  orders: [],
  activeOrders: [],
  orderHistory: [],
  isLoading: false,
  error: null,
  socket: null,

  // Actions
  setOrders: (orders) => set({ orders }),

  fetchOrders: async (tableNum = null) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IP}:3000/orders-get${
          tableNum ? `?table_num=${tableNum}` : ""
        }`
      );
      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();
      const processedOrders = data.map((order) => ({
        ...order,
        order_details:
          typeof order.order_details === "string"
            ? JSON.parse(order.order_details)
            : order.order_details,
      }));

      set({
        orders: processedOrders,
        activeOrders: processedOrders.filter(
          (order) => order.order_status !== "Completed"
        ),
        orderHistory: processedOrders.filter(
          (order) => order.order_status === "Completed"
        ),
        isLoading: false,
      });

      return processedOrders;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return [];
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IP}:3000/order-update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: orderId, order_status: status }),
        }
      );
      if (!response.ok) throw new Error("Failed to update order status");

      // Update local state
      set((state) => ({
        orders: state.orders.map((order) =>
          order.order_id === orderId
            ? { ...order, order_status: status }
            : order
        ),
      }));

      return true;
    } catch (error) {
      console.error("Error updating order status:", error);
      return false;
    }
  },

  initializeSocket: () => {
    const { socket } = get();
    if (socket) return; // Already initialized

    const newSocket = io(SOCKET_URL, {
      transports: ['polling'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('new-order', async (newOrder) => {
      console.log('New order received:', newOrder);
      await get().fetchOrders();
    });

    set({ socket: newSocket });
    return () => {
      if (newSocket) {
        newSocket.disconnect();
        set({ socket: null });
      }
    };
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  }
}));
