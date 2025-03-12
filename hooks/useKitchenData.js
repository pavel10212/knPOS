import { useEffect, useState, useCallback } from "react";
import { useOrderStore } from "./useOrderStore";
import { useMenuStore } from "./useMenuStore";
import { useSocketStore } from "./useSocket";
import { useSharedStore } from "./useSharedStore";

const RETRY_DELAY = 3000;
const MAX_RETRIES = 3;

export const useKitchenData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [statusMessages, setStatusMessages] = useState([]);

  const fetchOrders = useOrderStore((state) => state.fetchOrders);
  const fetchMenu = useMenuStore((state) => state.fetchMenu);
  const initializeSocket = useSocketStore((state) => state.initializeSocket);
  const disconnectSocket = useSocketStore((state) => state.disconnectSocket);
  
  // Set shared loading state
  const setSharedLoading = useSharedStore((state) => state.setIsLoading);
  const setLoadingStatus = useSharedStore((state) => state.setLoadingStatus);

  const fetchDataWithRetry = useCallback(async (fetchFn, name, retries = 0) => {
    try {
      await fetchFn();
      return true;
    } catch (error) {
      if (retries < MAX_RETRIES) {
        addStatus(`⚠️ Retrying ${name} (attempt ${retries + 1}/${MAX_RETRIES})...`);
        setTimeout(() => fetchDataWithRetry(fetchFn, name, retries + 1), RETRY_DELAY);
        return false;
      } else {
        console.error(
          `Failed to fetch ${name} after ${MAX_RETRIES} retries:`,
          error
        );
        addStatus(`❌ Failed to load ${name}`);
        return false;
      }
    }
  }, []);

  // Helper function for adding status messages
  const addStatus = useCallback((message) => {
    console.log(message);
    setStatusMessages(prev => [...prev, message]);
    setLoadingStatus(message);
  }, [setLoadingStatus]);

  useEffect(() => {
    const socketCleanup = initializeSocket();
    
    const initialLoad = async () => {
      addStatus("🚀 Initializing kitchen system...");
      setIsLoading(true);
      setSharedLoading(true);
      setLoadingProgress(0);
      
      try {
        // PHASE 1: Load orders first as highest priority for kitchen
        addStatus("📋 Loading order data...");
        const ordersLoaded = await fetchDataWithRetry(fetchOrders, "orders");
        setLoadingProgress(0.5); // 50% progress after orders
        
        // PHASE 2: Load menu data
        addStatus("🍽️ Loading menu items...");
        const menuLoaded = await fetchDataWithRetry(fetchMenu, "menu");
        setLoadingProgress(0.9); // 90% progress after menu
        
        if (ordersLoaded && menuLoaded) {
          addStatus("✅ Kitchen data loaded successfully");
        } else {
          addStatus("⚠️ Kitchen data loaded with some issues");
        }
        
        setLoadingProgress(1.0); // 100% complete
      } catch (error) {
        console.error("❌ Error during kitchen data loading:", error);
        addStatus(`❌ Error: ${error.message}`);
      } finally {
        // Complete loading regardless of success or failure
        setTimeout(() => {
          setIsLoading(false);
          setSharedLoading(false);
        }, 500); // Small delay to ensure UI updates complete
      }
    };
    
    initialLoad();

    return () => {
      socketCleanup();
      disconnectSocket();
    };
  }, [fetchDataWithRetry, addStatus]);
  
  // Return loading state information for use in the UI
  return {
    isLoading,
    loadingProgress,
    statusMessages
  };
};
