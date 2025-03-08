import { create } from "zustand";
import { reservationService } from "../services/reservationService";

export const useReservationStore = create((set, get) => ({
  // State
  reservations: [],
  todayReservations: [],
  upcomingReservations: [],
  upcomingGroupedByDate: {},
  selectedReservation: null,
  loading: false,
  error: null,

  // Selectors
  getReservationById: (id) => {
    const reservations = get().reservations;
    return reservations.find(
      (reservation) => reservation.reservation_id === id
    );
  },

  // Actions
  setSelectedReservation: (reservation) =>
    set({ selectedReservation: reservation }),

  clearSelectedReservation: () => set({ selectedReservation: null }),

  fetchReservations: async () => {
    set({ loading: true, error: null });
    try {
      const data = await reservationService.fetchAllReservations();
      set({ reservations: data, loading: false });
      return data;
    } catch (error) {
      console.error("❌ Error fetching reservations:", error);
      set({ error: "Error fetching reservations", loading: false });
      return [];
    }
  },

  fetchTodayReservations: async () => {
    set({ loading: true, error: null });
    try {
      const data = await reservationService.fetchTodayReservations();
      set({ todayReservations: data, loading: false });
      return data;
    } catch (error) {
      console.error("❌ Error fetching today's reservations:", error);
      set({ error: "Error fetching today's reservations", loading: false });
      return [];
    }
  },

  fetchReservationsInDateRange: async (startDate, endDate) => {
    set({ loading: true, error: null });
    try {
      const data = await reservationService.fetchReservationsInDateRange(
        startDate,
        endDate
      );
      set({ reservations: data, loading: false });
      return data;
    } catch (error) {
      console.error("❌ Error fetching reservations in date range:", error);
      set({ error: "Error fetching reservations", loading: false });
      return [];
    }
  },

  createReservation: async (reservationData) => {
    set({ loading: true, error: null });
    try {
      const newReservation = await reservationService.createReservation(
        reservationData
      );
      
      set((state) => {
        // Get the date string for grouping (YYYY-MM-DD format)
        const reservationDate = new Date(newReservation.reservation_time).toISOString().split('T')[0];
        
        // Make a copy of the existing grouped data
        const updatedGroupedByDate = { ...state.upcomingGroupedByDate };
        
        // Add the new reservation to the appropriate date group
        if (!updatedGroupedByDate[reservationDate]) {
          updatedGroupedByDate[reservationDate] = [];
        }
        updatedGroupedByDate[reservationDate] = [
          ...updatedGroupedByDate[reservationDate], 
          newReservation
        ];
        
        return {
          reservations: [...state.reservations, newReservation],
          todayReservations: isToday(newReservation.reservation_time)
            ? [...state.todayReservations, newReservation]
            : state.todayReservations,
          upcomingReservations: [...state.upcomingReservations, newReservation],
          upcomingGroupedByDate: updatedGroupedByDate,
          loading: false,
        };
      });
      
      return newReservation;
    } catch (error) {
      console.error("❌ Error creating reservation:", error);
      set({ error: "Error creating reservation", loading: false });
      throw error;
    }
  },

  updateReservation: async (id, reservationData) => {
    set({ loading: true, error: null });
    try {
      const updatedReservation = await reservationService.updateReservation(
        id,
        reservationData
      );
      
      set((state) => {
        // Get the new date string for grouping
        const reservationDate = new Date(updatedReservation.reservation_time).toISOString().split('T')[0];
        
        // Copy the existing grouped data
        const updatedGroupedByDate = { ...state.upcomingGroupedByDate };
        
        // Remove the reservation from all date groups
        Object.keys(updatedGroupedByDate).forEach(date => {
          updatedGroupedByDate[date] = updatedGroupedByDate[date].filter(
            r => r.reservation_id !== id
          );
          
          // Remove empty date entries
          if (updatedGroupedByDate[date].length === 0) {
            delete updatedGroupedByDate[date];
          }
        });
        
        // Add the updated reservation to the appropriate date group
        if (!updatedGroupedByDate[reservationDate]) {
          updatedGroupedByDate[reservationDate] = [];
        }
        updatedGroupedByDate[reservationDate] = [
          ...updatedGroupedByDate[reservationDate],
          updatedReservation
        ];
        
        return {
          reservations: state.reservations.map((r) =>
            r.reservation_id === id ? updatedReservation : r
          ),
          todayReservations: state.todayReservations.map((r) =>
            r.reservation_id === id ? updatedReservation : r
          ),
          upcomingReservations: state.upcomingReservations.map((r) =>
            r.reservation_id === id ? updatedReservation : r
          ),
          upcomingGroupedByDate: updatedGroupedByDate,
          loading: false,
        };
      });
      
      return updatedReservation;
    } catch (error) {
      console.error("❌ Error updating reservation:", error);
      set({ error: "Error updating reservation", loading: false });
      throw error;
    }
  },

  updateReservationStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const updatedReservation =
        await reservationService.updateReservationStatus(id, status);
        
      set((state) => {
        // Create a new upcoming reservations array with the updated status
        const updatedUpcomingReservations = state.upcomingReservations.map((r) =>
          r.reservation_id === id ? updatedReservation : r
        );
        
        // Make a copy of the existing grouped data
        const updatedGroupedByDate = { ...state.upcomingGroupedByDate };
        
        // Update the reservation status in each date group
        Object.keys(updatedGroupedByDate).forEach(date => {
          updatedGroupedByDate[date] = updatedGroupedByDate[date].map(r => 
            r.reservation_id === id ? updatedReservation : r
          );
        });
        
        return {
          reservations: state.reservations.map((r) =>
            r.reservation_id === id ? updatedReservation : r
          ),
          todayReservations: state.todayReservations.map((r) =>
            r.reservation_id === id ? updatedReservation : r
          ),
          upcomingReservations: updatedUpcomingReservations,
          upcomingGroupedByDate: updatedGroupedByDate,
          loading: false,
        };
      });
      
      return updatedReservation;
    } catch (error) {
      console.error("❌ Error updating reservation status:", error);
      set({ error: "Error updating reservation status", loading: false });
      throw error;
    }
  },

  deleteReservation: async (id) => {
    set({ loading: true, error: null });
    try {
      await reservationService.deleteReservation(id);
      
      set((state) => {
        // Create a new upcoming reservations array without the deleted reservation
        const filteredUpcomingReservations = state.upcomingReservations.filter(
          (r) => r.reservation_id !== id
        );
        
        // Make a copy of the existing grouped data
        const updatedGroupedByDate = { ...state.upcomingGroupedByDate };
        
        // Remove the deleted reservation from each date group
        Object.keys(updatedGroupedByDate).forEach(date => {
          updatedGroupedByDate[date] = updatedGroupedByDate[date].filter(
            r => r.reservation_id !== id
          );
          
          // Remove empty date entries
          if (updatedGroupedByDate[date].length === 0) {
            delete updatedGroupedByDate[date];
          }
        });
        
        return {
          reservations: state.reservations.filter((r) => r.reservation_id !== id),
          todayReservations: state.todayReservations.filter(
            (r) => r.reservation_id !== id
          ),
          upcomingReservations: filteredUpcomingReservations,
          upcomingGroupedByDate: updatedGroupedByDate,
          loading: false,
        };
      });
      
      return true;
    } catch (error) {
      console.error("❌ Error deleting reservation:", error);
      set({ error: "Error deleting reservation", loading: false });
      throw error;
    }
  },

  checkTableAvailability: async (
    tableId,
    startTime,
    endTime,
    excludeReservationId = null
  ) => {
    set({ loading: true, error: null });
    try {
      const result = await reservationService.checkTableAvailability(
        tableId,
        startTime,
        endTime,
        excludeReservationId
      );
      set({ loading: false });
      return result;
    } catch (error) {
      console.error("❌ Error checking table availability:", error);
      set({ error: "Error checking table availability", loading: false });
      throw error;
    }
  },
  fetchUpcomingReservations: async () => {
    set({ loading: true, error: null });
    try {
      const data = await reservationService.fetchUpcomingReservations();
      set({
        upcomingReservations: data.raw,
        upcomingGroupedByDate: data.grouped,
        loading: false,
      });
      return data;
    } catch (error) {
      console.error("❌ Error fetching upcoming reservations:", error);
      set({ error: "Error fetching upcoming reservations", loading: false });
      return { raw: [], grouped: {} };
    }
  },
}));

// Helper function to check if a date is today
function isToday(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
