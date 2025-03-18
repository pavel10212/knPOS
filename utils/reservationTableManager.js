import { useReservationStore } from "../hooks/useReservationStore";
import { tableStore } from "../hooks/useStore";
import { useSharedStore } from "../hooks/useSharedStore";

// How many hours before a reservation to mark the table as reserved
const HOURS_BEFORE_RESERVATION = 2;

/**
 * Start monitoring reservations and automatically update table statuses
 */
export const startReservationTableManager = () => {
  console.log("🔄 Starting reservation table manager");
  
  // Perform one-time check to ensure tables are properly marked
  setTimeout(() => {
    console.log("🕒 Performing initial reservation check");
    checkAndUpdateTableStatuses(true);
  }, 5000); // Wait 5 seconds for data to load
  
  // No polling interval anymore - we rely on websockets for updates
  return () => {
    console.log("🛑 Stopped reservation table manager");
  };
};

/**
 * Stop the reservation table manager - kept for API compatibility
 */
export const stopReservationTableManager = () => {
  console.log("🛑 Stopped reservation table manager");
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
    
    // Get current tables
    const tables = useSharedStore.getState().tables;
    
    // Current time plus buffer to find tables that should be reserved soon
    const currentTime = new Date();
    const reserveBeforeTime = new Date(currentTime.getTime() + (HOURS_BEFORE_RESERVATION * 60 * 60 * 1000));
    
    // Filter to find reservations within our window
    const relevantReservations = upcomingReservations.filter(reservation => {
      // Skip cancelled reservations
      if (reservation.status === "cancelled") return false;
      
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
        // Update the table status to Reserved
        await tableStore.getState().updateTableStatus(tableNum, 'Reserved');
        console.log(`✅ Table ${tableNum} marked as Reserved successfully`);
      } catch (error) {
        console.error(`❌ Failed to mark table ${tableNum} as Reserved:`, error);
      }
    }
    
    // Also check for completed/cancelled reservations to potentially free up tables
    const pastReservations = upcomingReservations.filter(reservation => {
      // Only consider completed, cancelled, or reservations that have passed
      if (["completed", "cancelled"].includes(reservation.status)) return true;
      
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
          console.log(`🔄 Making table ${tableNum} Available after completed/cancelled reservation`);
          
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