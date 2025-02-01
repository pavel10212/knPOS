import { useEffect } from "react";
import { tableStore } from "./useStore";
import { useOrderStore } from "./useOrderStore";
import { useMenuStore } from "./useMenuStore";
import { useSocketStore } from "./useSocket";
import { useInventoryStore } from "./useInventoryData";

export const useHomeData = () => {
  const fetchTables = tableStore((state) => state.fetchTables);
  const fetchInventory = useInventoryStore((state) => state.fetchInventory);
  const fetchOrders = useOrderStore((state) => state.fetchOrders);
  const fetchMenu = useMenuStore((state) => state.fetchMenu);
  const initializeSocket = useSocketStore((state) => state.initializeSocket);
  const disconnectSocket = useSocketStore((state) => state.disconnectSocket);

  useEffect(() => {
    const cleanup = initializeSocket();

    const initialLoad = async () => {
      await fetchTables();
      await fetchOrders();
      await fetchMenu();
      await fetchInventory();
    };
    initialLoad();

    return () => {
      cleanup();
      disconnectSocket();
    };
  }, []);
};
