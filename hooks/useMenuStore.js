import { useSharedStore } from "./useSharedStore";
import { create } from "zustand";
import { menuService } from "../services/menuService";

export const useMenuStore = create((set) => ({
  fetchMenu: async () => {
    const setMenu = useSharedStore.getState().setMenu;
    try {
      const data = await menuService.fetchMenu();
      setMenu(data);
      return data;
    } catch (error) {
      console.error("❌ Error fetching menu:", error);
    }
  },
}));
