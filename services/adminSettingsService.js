const API_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

// Cache settings with a 1-day expiration
let cachedSettings = null;
let cacheTimestamp = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1 day in milliseconds

/**
 * Service for fetching admin settings from the server
 */
export const adminSettingsService = {
  /**
   * Fetch all admin settings with 1-day caching
   * @returns {Array} Array of admin settings objects with setting_key and setting_value
   */
  async fetchAdminSettings() {
    try {
      // Check if we have valid cached data
      const now = Date.now();
      if (cachedSettings && cacheTimestamp && (now - cacheTimestamp < CACHE_DURATION)) {
        return cachedSettings;
      }
      
      const response = await fetch(`${API_URL}/admin-settings-get`, {
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch admin settings");
      }

      const data = await response.json();
      
      // Cache the settings and update timestamp
      cachedSettings = data;
      cacheTimestamp = now;
      
      return data;
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      throw error;
    }
  },
};

// Export the function directly for convenience
export const fetchAdminSettings = adminSettingsService.fetchAdminSettings;