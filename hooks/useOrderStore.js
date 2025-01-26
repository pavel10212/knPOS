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

  updateOrderNotes: async (orderId, itemId, notes) => {
    const orders = useSharedStore.getState().orders;
    const order = orders.find((o) => o.order_id === orderId);

    if (!order) {
      console.error("❌ Order not found");
      return false;
    }

    const orderDetails =
      typeof order.order_details === "string"
        ? JSON.parse(order.order_details)
        : order.order_details;

    const updatedDetails = orderDetails.map((item) =>
      item.menu_item_id === itemId ? { ...item, request: notes } : item
    );

    try {
      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IP}:3000/orders-update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            order_details: JSON.stringify(updatedDetails),
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update order notes");

      const updatedOrders = orders.map((o) =>
        o.order_id === orderId
          ? { ...o, order_details: JSON.stringify(updatedDetails) }
          : o
      );

      useSharedStore.getState().setOrders(updatedOrders);
      localStore.set("orders", JSON.stringify(updatedOrders));

      return true;
    } catch (error) {
      console.error("❌ Error updating order notes:", error);
      return false;
    }
  },

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
