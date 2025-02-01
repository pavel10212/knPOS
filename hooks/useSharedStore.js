import { create } from "zustand";

export const useSharedStore = create((set) => ({
  tables: [],
  setTables: (tables) => set({ tables }),
  menu: [],
  setMenu: (menu) => set({ menu }),
  orders: [],
  setOrders: (orders) => set({ orders }),
  inventory: [],
  setInventory: (inventory) => set({ inventory }),
}));
