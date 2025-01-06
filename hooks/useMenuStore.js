import { useSharedStore } from "./useSharedStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const CACHE_KEY = "cached_menu";

export const useMenuStore = create((set) => ({
  fetchMenu: async () => {
    const setMenu = useSharedStore.getState().setMenu;
    try {
      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IP}:3000/menu-get`
      );
      if (!response.ok) throw new Error("Failed to fetch menu");

      const data = await response.json();

      setMenu(data);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching menu:", error);
    }
  },
}));
