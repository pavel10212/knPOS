import { create } from "zustand";
import io from "socket.io-client";
import Toast from "react-native-toast-message";
import { useSharedStore } from "./useSharedStore";
import { localStore } from "./Storage/cache";

const SOCKET_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

export const useSocketStore = create((set, get) => ({
  socket: null,
  error: null,
  recentlyProcessedOrders: new Set(),
  processedOrders: new Set(),

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
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
      localStore.set("orders", JSON.stringify(updatedOrders));
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
}));
