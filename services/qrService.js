const API_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

export const qrService = {
  async generateToken(table_num) {
    try {
      const response = await fetch(`${API_URL}/generate-token`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
        body: JSON.stringify({ table_num }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to generate QR code: ${response.status}`);
      }

      const data = await response.json();
      if (!data || !data.url) {
        throw new Error('Invalid response from server - missing QR code URL');
      }

      return data;
    } catch (error) {
      console.error('QR service error:', error);
      throw error;
    }
  },
};
