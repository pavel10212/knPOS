import { useSharedStore } from "./useSharedStore";
import { create } from "zustand";

export const useMenuStore = create((set) => ({
  fetchMenu: async () => {
    const setMenu = useSharedStore.getState().setMenu;
    // Fetch menu from server
    try {
      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IP}:3000/admin-menu-get`
      );
      if (!response.ok) throw new Error("Failed to fetch menu");

      const data = await response.json();

      // Update shared store and cache
      setMenu(data);

      return data;
    } catch (error) {
      console.error("❌ Error fetching menu:", error);
    }
  },
}));
