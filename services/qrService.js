const API_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

export const qrService = {
  async generateToken(table_num) {
    const response = await fetch(`${API_URL}/generate-token`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
      },
      body: JSON.stringify({ table_num }),
    });

    if (!response.ok) throw new Error("Failed to generate QR code");
    return response.json();
  },
};
