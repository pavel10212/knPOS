import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSharedStore } from "./useSharedStore";

const CACHE_KEY = "cached_tables";

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

  // Use shared store for tables
  get tables() {
    return useSharedStore.getState().tables;
  },

  // Table Selection
  selectTable: async (table) => {
    try {
      set({
        selectedTable: {
          ...table,
        },
      });
    } catch (error) {
      console.error("Error selecting table:", error);
    }
  },
  setDropdownTable: (tableNumber) => set({ dropdownTableNumber: tableNumber }),
  updateSelectedTable: (table) => set({ selectedTable: table }),

  // Table Status
  updateTableStatus: async (tableNumber, newStatus) => {
    try {
      console.log(
        `📡 Sending PUT request to /table-update for table ${tableNumber} with status ${newStatus}`
      );
      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IP}:3000/table-update`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table_num: tableNumber,
            status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ Server response error:", errorData);
        throw new Error("Failed to update table status");
      }
      console.log(`✅ Table ${tableNumber} status updated successfully`);
      set((state) => {
        const updatedTables = state.tables.map((table) =>
          table.table_num === tableNumber
            ? {
                ...table,
                status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
              }
            : table
        );
        return {
          tables: updatedTables,
          selectedTable:
            state.selectedTable?.table_num === tableNumber
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

  // Orders
  updateSelectedTableOrders: (orders) =>
    set((state) => ({
      selectedTable: state.selectedTable
        ? { ...state.selectedTable, orders }
        : null,
    })),

  addOrderToTable: (tableNumber, order) =>
    set((state) => {
      const existingOrders = state.selectedTable?.orders || [];
      const existingOrder = existingOrders.find((o) => o.name === order.name);

      const updatedOrders = existingOrder
        ? existingOrders
            .map((o) => {
              if (o.name !== order.name) return o;
              const newQuantity = o.quantity + order.quantity;
              if (newQuantity <= 0) return null;

              const individualNotes =
                newQuantity > o.quantity
                  ? [
                      ...(o.individualNotes || []),
                      ...Array(order.quantity).fill(""),
                    ]
                  : (o.individualNotes || []).slice(0, newQuantity);

              return { ...o, quantity: newQuantity, individualNotes };
            })
            .filter(Boolean)
        : [
            ...existingOrders,
            { ...order, individualNotes: Array(order.quantity).fill("") },
          ];

      return {
        selectedTable: { ...state.selectedTable, orders: updatedOrders },
        tables: state.tables.map((table) =>
          table.number === tableNumber
            ? { ...table, orders: updatedOrders }
            : table
        ),
      };
    }),

  // Data Management
  fetchTables: async () => {
    try {
      console.log("📡 Fetching tables from cache...");
      const cachedData = await get().loadTablesFromCache();
      const setTables = useSharedStore.getState().setTables;

      if (cachedData) {
        console.log("✅ Using cached tables data");
        setTables(cachedData);
      }

      // Always fetch fresh data from server
      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IP}:3000/table-get`
      );
      if (!response.ok) throw new Error("Failed to fetch tables");

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
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(processedData));
    } catch (error) {
      console.error("❌ Error fetching tables:", error);
      const cachedData = await get().loadTablesFromCache();
      useSharedStore.getState().setTables(cachedData || []);
    }
  },

  // Cache helpers
  loadTablesFromCache: async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error("Error loading from cache:", error);
      return null;
    }
  },
}));
