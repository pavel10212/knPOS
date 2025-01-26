import { create } from "zustand";
import { useSharedStore } from "./useSharedStore";
import { localStore } from "./Storage/cache";

export const loginStore = create((set) => ({
  role: "waiter",
  isLoggedIn: false,
  setRole: (role) => set({ role }),
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
}));

export const tableStore = create((set, get) => ({
  // State
  selectedTable: null,
  dropdownTableNumber: null,
  reservationModal: { visible: false, tableNumber: null },
  paymentHistory: [],

  // Table Selection
  selectTable: (table) => {
    set({ selectedTable: table });
  },

  setDropdownTable: (tableNumber) => set({ dropdownTableNumber: tableNumber }),
  updateSelectedTable: (table) => set({ selectedTable: table }),

  // Table Status
  updateTableStatus: async (table_num, newStatus) => {
    try {
      console.log(
        `📡 Sending PUT request to /table-update for table ${table_num} with status ${newStatus}`
      );
      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IP}:3000/table-update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_num: table_num,
            status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ Server response error:", errorData);
        throw new Error("Failed to update table status");
      }
      console.log(`✅ Table ${table_num} status updated successfully`);

      const tables = useSharedStore.getState().tables;

      set((state) => {
        const updatedTables = tables.map((table) =>
          table.table_num === table_num
            ? {
                ...table,
                status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
              }
            : table
        );
        useSharedStore.getState().setTables(updatedTables);
        return {
          tables: updatedTables,
          selectedTable:
            state.selectedTable?.table_num === table_num
              ? {
                  ...state.selectedTable,
                  status:
                    newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
                }
              : state.selectedTable,
        };
      });
      return true;
    } catch (error) {
      console.error("❌ Error updating table status:", error);
      throw error;
    }
  },

  // Reservation
  setReservationModal: (modalState) => set({ reservationModal: modalState }),
  updateTableReservation: (tableNumber, reservationData) =>
    set((state) => {
      const updatedTables = state.tables.map((table) =>
        table.number === tableNumber
          ? {
              ...table,
              status: "reserved",
              reservation: {
                customerName: reservationData.customerName,
                time: reservationData.time,
                description: reservationData.description,
                reservedAt: reservationData.reservedAt,
              },
            }
          : table
      );

      return {
        tables: updatedTables,
        selectedTable: updatedTables.find((t) => t.table_num === tableNumber),
      };
    }),

  // Data Management
  fetchTables: async () => {
    const cachedTables = localStore.getString("tables");
    const setTables = useSharedStore.getState().setTables;

    if (cachedTables) {
      console.log("✅ Using cached tables data");
      setTables(JSON.parse(cachedTables));
      return;
    }

    try {
      console.log("Found no cache, fetching from server instead...");
      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IP}:3000/table-get`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch tables");
      }

      const data = await response.json();
      console.log(`✅ Received ${data.length} tables from server`);

      const processedData = data.map((table) => ({
        ...table,
        location:
          typeof table.location === "string"
            ? JSON.parse(table.location)
            : table.location,
      }));

      setTables(processedData);
      localStore.set("tables", JSON.stringify(processedData));
    } catch (error) {
      console.error("❌ Error fetching tables:", error);
      if (cachedTables) {
        console.log("ℹ️ Using fallback cached tables data");
        set({ tables: JSON.parse(cachedTables) });
      } else {
        console.error("❌ No cached data available");
        set({ tables: [] });
      }
    }
  },
}));
