const API_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

export const reservationService = {
  async fetchAllReservations() {
    try {
      const response = await fetch(`${API_URL}/reservations`, {
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch reservations");
      }
      return response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // New combined method in reservationService.js
  async fetchAllUpcomingReservations() {
    console.log("Fetching all upcoming reservations...");
    try {
      const response = await fetch(`${API_URL}/reservations/all-upcoming`, {
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reservations");
      }

      return response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  // Keep the existing methods for backward compatibility
  async fetchTodayReservations() {
    console.log("[DEPRECATED] Use fetchAllUpcomingReservations instead");
    try {
      const allData = await this.fetchAllUpcomingReservations();
      return allData.today;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async fetchUpcomingReservations() {
    console.log("[DEPRECATED] Use fetchAllUpcomingReservations instead");
    try {
      const allData = await this.fetchAllUpcomingReservations();
      return {
        raw: allData.all,
        grouped: allData.grouped,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async fetchReservationsInDateRange(startDate, endDate) {
    try {
      const response = await fetch(
        `${API_URL}/reservations/date-range?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch reservations in date range");
      }
      return response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async createReservation(reservationData) {
    try {
      const response = await fetch(`${API_URL}/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
        body: JSON.stringify(reservationData),
      });
      if (!response.ok) throw new Error("Failed to create reservation");
      return response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async updateReservation(id, reservationData) {
    try {
      const response = await fetch(`${API_URL}/reservations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
        body: JSON.stringify(reservationData),
      });
      if (!response.ok) throw new Error("Failed to update reservation");
      return response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async updateReservationStatus(id, status) {
    try {
      const response = await fetch(`${API_URL}/reservations/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update reservation status");
      return response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async deleteReservation(id) {
    try {
      const response = await fetch(`${API_URL}/reservations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete reservation");
      return response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async checkTableAvailability(
    tableId,
    startTime,
    endTime,
    excludeReservationId = null
  ) {
    try {
      console.log("Checking table availability...");
      const response = await fetch(
        `${API_URL}/reservations/availability?tableId=${tableId}&startTime=${startTime}&endTime=${endTime}${
          excludeReservationId
            ? `&excludeReservationId=${excludeReservationId}`
            : ""
        }`,
        {
          headers: {
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to check table availability");
      }

      return response.json();
    } catch (error) {
      console.error("Error checking table availability:", error);
      throw error;
    }
  },
};
