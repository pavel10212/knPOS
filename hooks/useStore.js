import { create } from "zustand";
import { useSharedStore } from "./useSharedStore";
import { tableService } from "../services/tableService";

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
  updateTableStatus: async (
    table_num,
    newStatus,
    reservationDetails = null
  ) => {
    try {
      console.log(
        `📡 Sending PUT request to /table-update for table ${table_num} with status ${newStatus}`
      );
      
      const updateData = await tableService.updateTableStatus(table_num, newStatus, reservationDetails);
      console.log(`✅ Table ${table_num} status updated successfully`);

      const tables = useSharedStore.getState().tables;

      // Update local state
      set((state) => {
        const updatedTables = tables.map((table) =>
          table.table_num === table_num
            ? {
                ...table,
                status: updateData.status,
                reservation_details: reservationDetails,
              }
            : table
        );

        useSharedStore.getState().setTables(updatedTables);

        return {
          selectedTable:
            state.selectedTable?.table_num === table_num
              ? {
                  ...state.selectedTable,
                  status: updateData.status,
                  reservation_details: reservationDetails,
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
    const setTables = useSharedStore.getState().setTables;

    try {
      console.log("Fetching tables from server...");
      const processedData = await tableService.fetchTables();
      console.log(`✅ Received ${processedData.length} tables from server`);
      setTables(processedData);
    } catch (error) {
      console.error("❌ Error fetching tables:", error);
      set({ tables: [] });
    }
  },
}));
