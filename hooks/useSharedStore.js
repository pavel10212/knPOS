import { create } from "zustand";

export const useSharedStore = create((set, get) => ({
  // Data states
  tables: [],
  setTables: (tables) => set({ tables }),
  menu: [],
  setMenu: (menu) => set({ menu }),
  orders: [],
  setOrders: (orders) => set({ orders: Array.isArray(orders) ? orders : [] }),
  inventory: [],
  setInventory: (inventory) => set({ inventory }),
  
  // Loading states
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
  loadingStatus: "",
  setLoadingStatus: (loadingStatus) => set({ loadingStatus }),

  // Helper function to ensure orders are initialized
  initializeOrders: () => {
    const currentOrders = get().orders;
    if (!Array.isArray(currentOrders)) {
      set({ orders: [] });
    }
  }
}));
