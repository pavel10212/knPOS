import { create } from "zustand";
import io from "socket.io-client";
import Toast from "react-native-toast-message";
import { useSharedStore } from "./useSharedStore";

const SOCKET_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

export const useSocketStore = create((set, get) => ({
  socket: null,
  error: null,
  recentlyProcessedOrders: new Set(),
  recentlyUpdatedOrders: new Set(),

  initializeSocket: () => {
    const { socket } = get();
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

    newSocket.on("order-updated", async (data) => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { recentlyUpdatedOrders } = get();
      const orderId = data.order_id;

      if (recentlyUpdatedOrders.has(orderId)) {
        console.log(
          `Order update ${orderId} was recently processed locally, ignoring socket event`
        );
        return;
      }

      console.log("Processing order update:", data);
      console.log("Current update prevention set:", recentlyUpdatedOrders);

      const currentOrders = useSharedStore.getState().orders;
      const updatedOrder = {
        ...data,
        order_details:
          typeof data.order_details === "string"
            ? JSON.parse(data.order_details)
            : data.order_details,
      };

      const updatedOrders = currentOrders.map((order) =>
        order.order_id === data.order_id ? updatedOrder : order
      );

      useSharedStore.getState().setOrders(updatedOrders);

      Toast.show({
        type: "info",
        text1: "Order Updated",
        text2: `Order ${data.order_id} has been updated`,
      });
    });

    newSocket.on("status-update", (data) => {
      const tables = useSharedStore.getState().tables;
      const setTables = useSharedStore.getState().setTables;

      const newTables = [
        ...tables.filter((table) => table.table_num !== data.table_num),
        data,
      ];

      setTables(newTables);

      Toast.show({
        type: "info",
        text1: "Table Status Updated",
        text2: `Table ${data.table_num} is now ${data.status}`,
      });

      console.log("Table status updated:", data);
    });

    newSocket.on("new-order", async (data) => {
      // Add small delay to ensure client-side tracking is complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { recentlyProcessedOrders } = get();
      const orderId = data.order_id;

      // Early exit if we just processed this order
      if (recentlyProcessedOrders.has(orderId)) {
        console.log(
          `Order ${orderId} was recently processed locally, ignoring socket event`
        );
        return;
      }

      console.log("The new order: ", data);
      console.log("The set: ", recentlyProcessedOrders);

      // Process the order
      const currentOrders = useSharedStore.getState().orders;
      const processedOrder = {
        ...data,
        order_details:
          typeof data.order_details === "string"
            ? JSON.parse(data.order_details)
            : data.order_details,
      };

      // Update state and storage
      const updatedOrders = [...currentOrders, processedOrder];
      useSharedStore.getState().setOrders(updatedOrders);

      Toast.show({
        type: "success",
        text1: "New Order Received",
        text2: `Table ${data.table_num}`,
      });
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

  trackProcessedOrder: (orderId) => {
    return new Promise((resolve) => {
      const { recentlyProcessedOrders } = get();
      console.log(`Tracking order ${orderId} in prevention system`);

      recentlyProcessedOrders.add(orderId);

      // Resolve immediately but keep the tracking active
      resolve();

      setTimeout(() => {
        const { recentlyProcessedOrders } = get();
        recentlyProcessedOrders.delete(orderId);
        console.log(`Removed order ${orderId} from prevention system`);
      }, 30000);
    });
  },

  trackUpdatedOrder: (orderId) => {
    return new Promise((resolve) => {
      const { recentlyUpdatedOrders } = get();
      console.log(`Tracking order update ${orderId} in prevention system`);

      recentlyUpdatedOrders.add(orderId);

      // Resolve immediately but keep tracking active
      resolve();

      setTimeout(() => {
        const { recentlyUpdatedOrders } = get();
        recentlyUpdatedOrders.delete(orderId);
        console.log(`Removed order update ${orderId} from prevention system`);
      }, 30000);
    });
  },
}));
