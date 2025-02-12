import { create } from "zustand";
import { useSharedStore } from "./useSharedStore";
import { orderService } from "../services/orderService";

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
      await orderService.updateOrderNotes(orderId, updatedDetails);
      
      const updatedOrders = orders.map((o) =>
        o.order_id === orderId
          ? { ...o, order_details: JSON.stringify(updatedDetails) }
          : o
      );

      useSharedStore.getState().setOrders(updatedOrders);

      return true;
    } catch (error) {
      console.error("❌ Error updating order notes:", error);
      return false;
    }
  },

  fetchOrders: async () => {
    const setOrders = useSharedStore.getState().setOrders;

    try {
      const data = await orderService.fetchTodayOrders();
      setOrders(data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching orders:", error);
      set({ error: "Error fetching orders" });
    }
  },
}));
