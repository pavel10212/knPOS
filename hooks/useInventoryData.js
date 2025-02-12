import { create } from "zustand";
import { useSharedStore } from "./useSharedStore";
import { inventoryService } from "../services/inventoryService";

export const useInventoryStore = create((set, get) => ({
  error: null,
  selectedInventoryItem: null,
  setSelectedInventoryItem: (item) => set({ selectedInventoryItem: item }),

  fetchInventory: async () => {
    const setInventory = useSharedStore.getState().setInventory;
    try {
      const inventory = await inventoryService.fetchInventory();
      setInventory(inventory);
    } catch (error) {
      console.error("❌ Error fetching inventory:", error);
      set({ error });
    }
  },
}));
