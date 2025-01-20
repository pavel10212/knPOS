import { useEffect } from "react";
import { useOrderStore } from "./useOrderStore";
import { useMenuStore } from "./useMenuStore";

export const useKitchenData = () => {
  const fetchOrders = useOrderStore((state) => state.fetchOrders);
  const fetchMenu = useMenuStore((state) => state.fetchMenu);
  const initializeSocket = useOrderStore((state) => state.initializeSocket);
  const disconnectSocket = useOrderStore((state) => state.disconnectSocket);

  useEffect(() => {
    const cleanup = initializeSocket();

    const initializeLoad = async () => {
      await fetchOrders();
      await fetchMenu();
    }
    initializeLoad();

    return () => {
      cleanup();
      disconnectSocket();
    }
  }, []);
};

