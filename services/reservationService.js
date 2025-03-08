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

  async fetchTodayReservations() {
    try {
      const response = await fetch(`${API_URL}/reservations/today`, {
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch today's reservations");
      }
      return response.json();
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
};
