import { create } from "zustand";
import { reservationService } from "../services/reservationService";

export const useReservationStore = create((set, get) => ({
  // State
  reservations: [],
  todayReservations: [],
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
      set((state) => ({
        reservations: [...state.reservations, newReservation],
        todayReservations: isToday(newReservation.reservation_time)
          ? [...state.todayReservations, newReservation]
          : state.todayReservations,
        loading: false,
      }));
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
      set((state) => ({
        reservations: state.reservations.map((r) =>
          r.reservation_id === id ? updatedReservation : r
        ),
        todayReservations: state.todayReservations.map((r) =>
          r.reservation_id === id ? updatedReservation : r
        ),
        loading: false,
      }));
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
      set((state) => ({
        reservations: state.reservations.map((r) =>
          r.reservation_id === id ? updatedReservation : r
        ),
        todayReservations: state.todayReservations.map((r) =>
          r.reservation_id === id ? updatedReservation : r
        ),
        loading: false,
      }));
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
      set((state) => ({
        reservations: state.reservations.filter((r) => r.reservation_id !== id),
        todayReservations: state.todayReservations.filter(
          (r) => r.reservation_id !== id
        ),
        loading: false,
      }));
      return true;
    } catch (error) {
      console.error("❌ Error deleting reservation:", error);
      set({ error: "Error deleting reservation", loading: false });
      throw error;
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
