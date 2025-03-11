import { useReservationStore } from "../hooks/useReservationStore";
import { tableStore } from "../hooks/useStore";
import { useSharedStore } from "../hooks/useSharedStore";

// Interval in milliseconds to check reservation statuses (every 5 minutes)
const CHECK_INTERVAL = 5 * 60 * 1000;

// How many hours before a reservation to mark the table as reserved
const HOURS_BEFORE_RESERVATION = 2;

let intervalId = null;
let isInitialCheckCompleted = false;

/**
 * Start monitoring reservations and automatically update table statuses
 */
export const startReservationTableManager = () => {
  if (intervalId) {
    console.log("Reservation table manager already running");
    return;
  }

  console.log("🔄 Starting reservation table manager");
  
  // We'll delay the initial check to ensure data is loaded
  const initialCheckDelay = setTimeout(() => {
    console.log("🕒 Performing delayed initial reservation check to ensure data is loaded");
    checkAndUpdateTableStatuses(true);
    
    // Set up interval for regular checks after initial check
    intervalId = setInterval(() => {
      checkAndUpdateTableStatuses();
    }, CHECK_INTERVAL);
  }, 5000); // Wait 5 seconds for data to load
  
  return () => {
    if (initialCheckDelay) {
      clearTimeout(initialCheckDelay);
    }
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      console.log("🛑 Stopped reservation table manager");
    }
  };
};

/**
 * Stop the reservation table manager
 */
export const stopReservationTableManager = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("🛑 Stopped reservation table manager");
  }
};

/**
 * Check upcoming reservations and update table statuses accordingly
 * @param {boolean} forceRefresh - Whether to force a refresh of reservation data
 */
const checkAndUpdateTableStatuses = async (forceRefresh = false) => {
  console.log("⏰ Checking reservations to update table statuses...");
  
  try {
    // Force refresh to get the latest reservation data
    const data = await useReservationStore.getState().fetchAllReservationData(forceRefresh);
    const { today: todayReservations, all: upcomingReservations } = data;
    
    console.log(`📊 Found ${upcomingReservations?.length || 0} total upcoming reservations`);
    
    // If we didn't get any reservations and this is the initial check, try again after a delay
    if ((!upcomingReservations || upcomingReservations.length === 0) && !isInitialCheckCompleted) {
      console.log("⚠️ No reservations found on initial check, will retry after delay");
      setTimeout(() => {
        checkAndUpdateTableStatuses(true);
      }, 10000); // Try again after 10 seconds
      return;
    }
    
    // Mark that we've completed the initial check
    isInitialCheckCompleted = true;
    
    // Get current tables
    const tables = useSharedStore.getState().tables;
    
    // Current time plus buffer to find tables that should be reserved soon
    const currentTime = new Date();
    const reserveBeforeTime = new Date(currentTime.getTime() + (HOURS_BEFORE_RESERVATION * 60 * 60 * 1000));
    
    // Filter to find reservations within our window
    const relevantReservations = upcomingReservations.filter(reservation => {
      // Skip canceled reservations
      if (reservation.status === "canceled") return false;
      
      const reservationTime = new Date(reservation.reservation_time);
      
      // If reservation is in the past, ignore it
      if (reservationTime < currentTime) return false;
      
      // If reservation is within our window (current time to HOURS_BEFORE_RESERVATION from now)
      // and the status is not seated or completed, it's relevant
      return reservationTime <= reserveBeforeTime && 
             !["seated", "completed"].includes(reservation.status);
    });
    
    console.log(`Found ${relevantReservations.length} reservations to process`);
    
    // Process each reservation and update table status if needed
    for (const reservation of relevantReservations) {
      const tableId = reservation.table_id;
      const tableNum = tables.find(t => t.table_id === tableId)?.table_num || tableId;
      
      if (!tableNum) {
        console.log(`⚠️ Could not find table number for reservation ${reservation.reservation_id}`);
        continue;
      }
      
      const table = tables.find(t => String(t.table_num) === String(tableNum));
      
      // If table doesn't exist or is already marked as Reserved, skip it
      if (!table || table.status === "Reserved") continue;
      
      console.log(`🔄 Marking table ${tableNum} as Reserved for upcoming reservation at ${new Date(reservation.reservation_time).toLocaleTimeString()}`);
      
      try {
        // Update the table status to Reserved - no longer passing reservation details
        await tableStore.getState().updateTableStatus(tableNum, 'Reserved');
        console.log(`✅ Table ${tableNum} marked as Reserved successfully`);
      } catch (error) {
        console.error(`❌ Failed to mark table ${tableNum} as Reserved:`, error);
      }
    }
    
    // Also check for completed/canceled reservations to potentially free up tables
    const pastReservations = upcomingReservations.filter(reservation => {
      // Only consider completed, canceled, or reservations that have passed
      if (["completed", "canceled"].includes(reservation.status)) return true;
      
      const reservationTime = new Date(reservation.reservation_time);
      const endTime = reservation.end_time 
        ? new Date(reservation.end_time)
        : new Date(reservationTime.getTime() + 2 * 60 * 60 * 1000); // Default 2 hours
        
      // If end time has passed
      return endTime < currentTime;
    });
    
    // Process each past reservation to free up tables if necessary
    for (const reservation of pastReservations) {
      const tableId = reservation.table_id;
      const tableNum = tables.find(t => t.table_id === tableId)?.table_num || tableId;
      
      if (!tableNum) continue;
      
      const table = tables.find(t => String(t.table_num) === String(tableNum));
      
      // If table is Reserved, make it Available
      if (table && table.status === "Reserved") {
        // We need to check if there are any other active reservations for this table
        // before marking it as available
        const otherActiveReservations = relevantReservations.filter(res => 
          res.reservation_id !== reservation.reservation_id && 
          res.table_id === tableId
        );
        
        if (otherActiveReservations.length === 0) {
          console.log(`🔄 Making table ${tableNum} Available after completed/canceled reservation`);
          
          try {
            // Reset the table token and make it Available
            await tableStore.getState().resetTableToken(tableNum);
            console.log(`✅ Table ${tableNum} reset to Available successfully`);
          } catch (error) {
            console.error(`❌ Failed to reset table ${tableNum}:`, error);
          }
        } else {
          console.log(`⚠️ Table ${tableNum} still has ${otherActiveReservations.length} active reservations - keeping as Reserved`);
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error checking reservations for table updates:", error);
  }
};