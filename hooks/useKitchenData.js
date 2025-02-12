import { useEffect, useCallback } from "react";
import { useOrderStore } from "./useOrderStore";
import { useMenuStore } from "./useMenuStore";
import { useSocketStore } from "./useSocket";

const RETRY_DELAY = 3000;
const MAX_RETRIES = 3;

export const useKitchenData = () => {
  const fetchOrders = useOrderStore((state) => state.fetchOrders);
  const fetchMenu = useMenuStore((state) => state.fetchMenu);
  const initializeSocket = useSocketStore((state) => state.initializeSocket);
  const disconnectSocket = useSocketStore((state) => state.disconnectSocket);

  const fetchDataWithRetry = useCallback(async (fetchFn, retries = 0) => {
    try {
      await fetchFn();
    } catch (error) {
      if (retries < MAX_RETRIES) {
        setTimeout(() => fetchDataWithRetry(fetchFn, retries + 1), RETRY_DELAY);
      } else {
        console.error(
          `Failed to fetch data after ${MAX_RETRIES} retries:`,
          error
        );
      }
    }
  }, []);

  useEffect(() => {
    const cleanup = initializeSocket();

    const initializeLoad = async () => {
      await Promise.all([
        fetchDataWithRetry(fetchOrders),
        fetchDataWithRetry(fetchMenu),
      ]);
    };

    initializeLoad();

    return () => {
      cleanup();
      disconnectSocket();
    };
  }, [fetchDataWithRetry]);
};
