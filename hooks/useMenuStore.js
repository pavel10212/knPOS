import {useSharedStore} from "./useSharedStore";
import {localStore} from "./Storage/cache";
import {create} from "zustand";

export const useMenuStore = create((set) => ({
  fetchMenu: async () => {
    const setMenu = useSharedStore.getState().setMenu;
    // START: Cache-based logic (REMOVE IN PRODUCTION)
    try {
      const cachedMenu = localStore.getString("menu");
      if (cachedMenu) {
        console.log("✅ Using cached menu data");
        const parsedMenu = JSON.parse(cachedMenu);
        setMenu(parsedMenu);
        return parsedMenu;
      }
      console.log("⏳ No cached menu found, fetching from server...");
    } catch (error) {
      console.error("❌ Error accessing menu cache:", error);
    }
    // END: Cache-based logic (REMOVE IN PRODUCTION)

    // Fetch menu from server
    try {
      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IP}:3000/menu-get`
      );
      if (!response.ok) throw new Error("Failed to fetch menu");

      const data = await response.json();

      // Update shared store and cache
      setMenu(data);
      localStore.set("menu", JSON.stringify(data)); // Save to cache (REMOVE IN PRODUCTION)

      return data;
    } catch (error) {
      console.error("❌ Error fetching menu:", error);
    }
  },
}));
