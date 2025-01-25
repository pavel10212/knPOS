import { create } from "zustand";
import { useSharedStore } from "./useSharedStore";
import { localStore } from "./Storage/cache";

export const useOrderStore = create((set, get) => ({
  // State
  activeOrders: [],
  orderHistory: [],
  error: null,
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
}));
