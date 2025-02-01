import { create } from "zustand";
import { useSharedStore } from "./useSharedStore";

export const useInventoryStore = create((set, get) => ({
  error: null,
  selectedInventoryItem: null,
  setSelectedInventoryItem: (item) => set({ selectedInventoryItem: item }),

  fetchInventory: async () => {
    const setInventory = useSharedStore.getState().setInventory;
    try {
      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IP}:3000/inventory-get`
      );

      if (!response.ok) throw new Error("Failed to fetch inventory");

      const inventory = await response.json();
      setInventory(inventory);
    } catch (error) {
      console.error("❌ Error fetching inventory:", error);
      set({ error });
    }
  },
}));
