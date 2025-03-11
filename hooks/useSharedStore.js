import { create } from "zustand";

export const useSharedStore = create((set) => ({
  // Data states
  tables: [],
  setTables: (tables) => set({ tables }),
  menu: [],
  setMenu: (menu) => set({ menu }),
  orders: [],
  setOrders: (orders) => set({ orders }),
  inventory: [],
  setInventory: (inventory) => set({ inventory }),
  
  // Loading states
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
  loadingStatus: "",
  setLoadingStatus: (loadingStatus) => set({ loadingStatus }),
}));
