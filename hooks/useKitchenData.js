import { useEffect } from "react";
import { useOrderStore } from "./useOrderStore";
import { useMenuStore } from "./useMenuStore";
import { useSocketStore } from "./useSocket";

export const useKitchenData = () => {
  const fetchOrders = useOrderStore((state) => state.fetchOrders);
  const fetchMenu = useMenuStore((state) => state.fetchMenu);
  const initializeSocket = useSocketStore((state) => state.initializeSocket);
  const disconnectSocket = useSocketStore((state) => state.disconnectSocket);

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

