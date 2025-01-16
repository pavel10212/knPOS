import {useEffect} from "react";
import {tableStore} from "./useStore";
import {useOrderStore} from "./useOrderStore";
import {useMenuStore} from "./useMenuStore";

export const useHomeData = () => {
  const fetchTables = tableStore((state) => state.fetchTables);
  const fetchOrders = useOrderStore((state) => state.fetchOrders);
  const fetchMenu = useMenuStore((state) => state.fetchMenu);
  const initializeSocket = useOrderStore((state) => state.initializeSocket);
  const disconnectSocket = useOrderStore((state) => state.disconnectSocket);

  useEffect(() => {
    const cleanup = initializeSocket();

    const initialLoad = async () => {
      await fetchTables();
      await fetchOrders();
      await fetchMenu();
    };
    initialLoad();

    return () => {
      cleanup();
      disconnectSocket();
    };
  }, []);
};
