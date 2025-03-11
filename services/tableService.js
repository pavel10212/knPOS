const API_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

export const tableService = {
  async resetTableToken(table_num) {
    const response = await fetch(`${API_URL}/table-reset`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
      },
      body: JSON.stringify({ table_num }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ Server response error:", errorData);
      throw new Error("Failed to reset table token");
    }

    return { table_num };
  },

  async updateTableStatus(table_num, newStatus) {
    const updateData = {
      table_num,
      status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
    };

    const response = await fetch(`${API_URL}/table-update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ Server response error:", errorData);
      throw new Error("Failed to update table status");
    }

    return updateData;
  },

  async fetchTables() {
    const response = await fetch(`${API_URL}/table-get`, {
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch tables");

    const data = await response.json();
    return data.map((table) => ({
      ...table,
      location:
        typeof table.location === "string"
          ? JSON.parse(table.location)
          : table.location,
    }));
  },
};
