const API_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

/**
 * Service for fetching all initial app data in a single network request
 * This optimizes the startup process by reducing the number of API calls
 */
export const initialDataService = {
  /**
   * Fetch all critical initial data (tables, orders, reservations) in a single request
   * @returns {Object} Combined initial data object
   */
  async fetchInitialData() {
    console.log("Fetching initial app data in optimized single request...");
    try {
      const response = await fetch(`${API_URL}/initial-data`, {
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
      });

      if (!response.ok) {
        console.error("Initial data fetch failed with status:", response.status);
        throw new Error("Failed to fetch initial app data");
      }

      const data = await response.json();
      console.log("✅ Successfully loaded initial data bundle");
      return data;
    } catch (error) {
      console.error("❌ Error fetching initial data:", error);
      throw error;
    }
  },
};