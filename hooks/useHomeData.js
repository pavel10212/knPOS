import { useEffect, useState } from "react";
import { tableStore } from "./useStore";
import { useOrderStore } from "./useOrderStore";
import { useMenuStore } from "./useMenuStore";
import { useSocketStore } from "./useSocket";
import { useInventoryStore } from "./useInventoryData";
import { useReservationStore } from "./useReservationStore";
import { useSharedStore } from "./useSharedStore";
import { startReservationTableManager, stopReservationTableManager } from "../utils/reservationTableManager";

/**
 * Custom hook for managing the initial data loading and ongoing data maintenance
 * for the home screen and other parts of the app
 */
export const useHomeData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [statusMessages, setStatusMessages] = useState([]);

  // Data fetching functions
  const fetchTables = tableStore((state) => state.fetchTables);
  const fetchInventory = useInventoryStore((state) => state.fetchInventory);
  const fetchOrders = useOrderStore((state) => state.fetchOrders);
  const fetchMenu = useMenuStore((state) => state.fetchMenu);
  const fetchReservations = useReservationStore((state) => state.fetchAllReservationData);
  const initializeSocket = useSocketStore((state) => state.initializeSocket);
  const disconnectSocket = useSocketStore((state) => state.disconnectSocket);
  
  // Set shared loading state
  const setSharedLoading = useSharedStore((state) => state.setIsLoading);
  const setLoadingStatus = useSharedStore((state) => state.setLoadingStatus);

  useEffect(() => {
    const socketCleanup = initializeSocket();
    
    // Helper function for adding status messages
    const addStatus = (message) => {
      console.log(message);
      setStatusMessages(prev => [...prev, message]);
      setLoadingStatus(message);
    };

    const initialLoad = async () => {
      addStatus("🚀 Loading initial app data...");
      setIsLoading(true);
      setSharedLoading(true);
      setLoadingProgress(0);
      
      try {
        // PHASE 1: Load critical data first (tables and reservations) in parallel
        addStatus("📊 Loading tables and reservations...");
        
        const [tablesData, reservationsData] = await Promise.all([
          fetchTables().catch(e => {
            console.error("Error fetching tables:", e);
            addStatus("⚠️ Failed to load tables");
            return null;
          }),
          fetchReservations(true).catch(e => {
            console.error("Error fetching reservations:", e);
            addStatus("⚠️ Failed to load reservations");
            return { all: [], today: [], grouped: {} };
          })
        ]);
        
        setLoadingProgress(0.4); // 40% progress after critical data
        
        // Immediately mark tables as reserved for upcoming reservations
        if (tablesData && reservationsData) {
          addStatus("🔄 Processing reservations...");
          await immediatelyMarkReservedTables(reservationsData);
        }
        
        setLoadingProgress(0.5); // 50% progress after table marking
        
        // PHASE 2: Load remaining data in parallel
        addStatus("📋 Loading orders, menu items, and inventory...");
        
        await Promise.all([
          fetchOrders().catch(e => {
            console.error("Error fetching orders:", e);
            addStatus("⚠️ Failed to load orders");
          }),
          fetchMenu().catch(e => {
            console.error("Error fetching menu:", e);
            addStatus("⚠️ Failed to load menu");
          }),
          fetchInventory().catch(e => {
            console.error("Error fetching inventory:", e);
            addStatus("⚠️ Failed to load inventory");
          })
        ]);
        
        setLoadingProgress(0.9); // 90% progress after all data loaded
        
        addStatus("✅ Initial data loading complete");
        
        // Start the reservation table manager for ongoing monitoring
        addStatus("🔄 Starting reservation table manager");
        setLoadingProgress(1.0); // 100% complete
        
        return startReservationTableManager();
      } catch (error) {
        console.error("❌ Error during initial data loading:", error);
        addStatus(`❌ Error: ${error.message}`);
        return () => stopReservationTableManager();
      } finally {
        // Complete loading regardless of success or failure
        setTimeout(() => {
          setIsLoading(false);
          setSharedLoading(false);
        }, 500); // Small delay to ensure UI updates complete
      }
    };
    
    // Function to immediately mark tables as reserved for upcoming reservations
    const immediatelyMarkReservedTables = async (reservationData) => {
      try {
        const tables = useSharedStore.getState().tables;
        const upcomingReservations = reservationData.all || [];
        
        // Current time plus 2 hours to find reservations within our window
        const currentTime = new Date();
        const twoHoursFromNow = new Date(currentTime.getTime() + (2 * 60 * 60 * 1000));
        
        addStatus(`🕒 Checking ${upcomingReservations.length} upcoming reservations`);
        
        // Filter to find reservations within our window
        const relevantReservations = upcomingReservations.filter(reservation => {
          // Skip cancelled reservations
          if (reservation.status === "cancelled") return false;
          
          const reservationTime = new Date(reservation.reservation_time);
          
          // If reservation is in the past, ignore it
          if (reservationTime < currentTime) return false;
          
          // If reservation is within our window and not seated or completed, it's relevant
          return reservationTime <= twoHoursFromNow && 
                 !["seated", "completed"].includes(reservation.status);
        });
        
        if (relevantReservations.length > 0) {
          addStatus(`Found ${relevantReservations.length} reservations within 2 hours`);
          
          // Process each reservation and update table status if needed
          for (const reservation of relevantReservations) {
            const tableId = reservation.table_id;
            const tableNum = tables.find(t => t.table_id === tableId)?.table_num || tableId;
            
            if (!tableNum) {
              continue;
            }
            
            const table = tables.find(t => String(t.table_num) === String(tableNum));
            
            // If table doesn't exist or is already marked as Reserved, skip it
            if (!table || table.status === "Reserved") continue;
            
            addStatus(`Marking table ${tableNum} as Reserved`);
            
            try {
              await tableStore.getState().updateTableStatus(tableNum, 'Reserved');
            } catch (error) {
              console.error(`❌ Failed to mark table ${tableNum} as Reserved:`, error);
            }
          }
        } else {
          addStatus("No upcoming reservations requiring immediate table marking");
        }
      } catch (error) {
        console.error("❌ Error marking tables as reserved during startup:", error);
        addStatus("⚠️ Error marking reserved tables");
      }
    };
    
    // Start loading data and get the cleanup function for the reservation manager
    const loadDataPromise = initialLoad();
    let reservationManagerCleanup;
    
    loadDataPromise.then(cleanup => {
      reservationManagerCleanup = cleanup;
    });

    return () => {
      socketCleanup();
      disconnectSocket();
      
      // Make sure to stop the reservation table manager when unmounting
      if (reservationManagerCleanup) {
        reservationManagerCleanup();
      } else {
        stopReservationTableManager();
      }
    };
  }, []);
  
  // Return loading state information for use in the UI
  return {
    isLoading,
    loadingProgress,
    statusMessages
  };
};
