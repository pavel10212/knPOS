const API_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

export const inventoryService = {
  async fetchInventory() {
    const response = await fetch(`${API_URL}/inventory-get`, {
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
      }
    });
    
    if (!response.ok) throw new Error("Failed to fetch inventory");
    return response.json();
  }
};
