import { create } from "zustand";
import Toast from "react-native-toast-message";
import io from "socket.io-client";
import { useSharedStore } from "./useSharedStore";
import { localStore } from "./Storage/cache";

const SOCKET_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

export const useOrderStore = create((set, get) => ({
  // State
  activeOrders: [],
  orderHistory: [],
  error: null,
  socket: null,
  selectedOrder: null,
  recentlyProcessedOrders: new Set(),
  setSelectedOrder: (order) => set({ selectedOrder: order }),

  fetchOrders: async () => {
    const setOrders = useSharedStore.getState().setOrders;

    try {
      const cachedMenu = localStore.getString("orders");
      if (cachedMenu) {
        console.log("✅ Using cached orders data");
        const parsedOrders = JSON.parse(cachedMenu);
        setOrders(parsedOrders);
        return parsedOrders;
      }
      console.log("⏳ No cached orders found, fetching from server...");
    } catch (error) {
      console.error("❌ Error accessing orders cache:", error);
      set({ error: "Error accessing orders cache" });
    }

    try {
      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IP}:3000/orders-get`
      );

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();

      setOrders(data);
      localStore.set("orders", JSON.stringify(data));

      return data;
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      set({ error: "Error fetching orders" });
    }
  },

  initializeSocket: () => {
    const { socket, recentlyProcessedOrders } = get();
    if (socket) return;

    const newSocket = io(SOCKET_URL, {
      transports: ["polling"],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      set({ error: "Socket connection error" });
    });

    newSocket.on("new-order", async (newOrder) => {
      // Check if we've recently processed this order
      if (recentlyProcessedOrders.has(newOrder.order_id)) {
        console.log("Skipping duplicate order:", newOrder.order_id);
        return;
      }

      console.log("New order received:", newOrder);

      // Get current orders from localStorage and state
      const currentOrders = useSharedStore.getState().orders;

      // Ensure order_details is properly parsed
      const processedOrder = {
        ...newOrder,
        order_details:
          typeof newOrder.order_details === "string"
            ? JSON.parse(newOrder.order_details)
            : newOrder.order_details,
      };

      // Create new orders array
      const updatedOrders = [...currentOrders, processedOrder];

      // Update localStorage
      localStore.set("orders", JSON.stringify(updatedOrders));

      Toast.show({
        type: "success",
        text1: "New order received",
        text2: `Table ${newOrder.table_num}`,
      });

      // Update global state
      useSharedStore.getState().setOrders(updatedOrders);
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
  },

  // Add this method to track processed orders
  trackProcessedOrder: (orderId) => {
    const { recentlyProcessedOrders } = get();
    recentlyProcessedOrders.add(orderId);
    // Remove the order ID from tracking after 5 seconds
    setTimeout(() => {
      recentlyProcessedOrders.delete(orderId);
    }, 5000);
  },
}));
