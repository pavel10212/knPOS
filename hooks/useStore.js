import { create } from "zustand";

export const loginStore = create((set) => ({
  role: "waiter",
  setRole: (role) => set({ role }),
  isLoggedIn: false,
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
}));

export const tableStore = create((set) => ({
  // Table State
  tables: [
    {
      number: 1,
      persons: 2,
      status: "unavailable",
      reservation: null,
      orders: [],
    },
    {
      number: 2,
      persons: 4,
      status: "available",
      reservation: null,
      orders: [],
    },
    {
      number: 3,
      persons: 2,
      status: "reserved",
      reservation: null,
      orders: [],
    },
    {
      number: 4,
      persons: 4,
      status: "available",
      reservation: null,
      orders: [],
    },
    {
      number: 5,
      persons: 2,
      status: "unavailable",
      reservation: null,
      orders: [],
    },
    {
      number: 6,
      persons: 4,
      status: "available",
      reservation: null,
      orders: [],
    },
    {
      number: 7,
      persons: 4,
      status: "reserved",
      reservation: null,
      orders: [],
    },
    {
      number: 8,
      persons: 2,
      status: "available",
      reservation: null,
      orders: [],
    },
    {
      number: 9,
      persons: 4,
      status: "unavailable",
      reservation: null,
      orders: [],
    },
  ],
  selectedTable: null,
  dropdownTableNumber: null,
  reservationModal: { visible: false, tableNumber: null },
  paymentHistory: [],

  // Table Selection Actions
  selectTable: (table) =>
    set((state) => {
      const existingTable = state.tables.find((t) => t.number === table.number);
      return {
        selectedTable: {
          ...table,
          orders: existingTable?.orders || [],
        },
      };
    }),
  setDropdownTable: (tableNumber) => set({ dropdownTableNumber: tableNumber }),
  updateSelectedTable: (table) => set({ selectedTable: table }),

  // Table Status Management
  updateTableStatus: (tableNumber, newStatus) =>
    set((state) => ({
      tables: state.tables.map((table) =>
        table.number === tableNumber ? { ...table, status: newStatus } : table
      ),
      selectedTable:
        state.selectedTable?.number === tableNumber
          ? { ...state.selectedTable, status: newStatus }
          : state.selectedTable,
    })),

  // Reservation Management
  setReservationModal: (modalState) => set({ reservationModal: modalState }),
  handleReservation: (tableNumber) =>
    set({ reservationModal: { visible: true, tableNumber } }),
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
        selectedTable: updatedTables.find((t) => t.number === tableNumber),
      };
    }),

  // Order Management
  updateSelectedTableOrders: (orders) =>
    set((state) => ({
      selectedTable: state.selectedTable
        ? { ...state.selectedTable, orders }
        : null,
    })),

  updateOrderNotes: (tableNumber, orderName, index, notes) =>
    set((state) => {
      const updatedTables = state.tables.map((table) => {
        if (table.number === tableNumber) {
          const updatedOrders = table.orders.map((order) => {
            if (order.name === orderName) {
              const updatedIndividualNotes = [...(order.individualNotes || Array(order.quantity).fill(''))];
              updatedIndividualNotes[index] = notes;
              return {
                ...order,
                individualNotes: updatedIndividualNotes,
              };
            }
            return order;
          });
          return { ...table, orders: updatedOrders };
        }
        return table;
      });

      return {
        tables: updatedTables,
        selectedTable: updatedTables.find((t) => t.number === tableNumber),
      };
    }),

  addOrderToTable: (tableNumber, order) =>
    set((state) => {
      const existingOrders = state.selectedTable?.orders || [];
      const existingOrder = existingOrders.find((o) => o.name === order.name);

      let updatedOrders;
      if (existingOrder) {
        updatedOrders = existingOrders.map((o) => {
          if (o.name === order.name) {
            const newQuantity = o.quantity + order.quantity;
            if (newQuantity <= 0) return null;
            
            let individualNotes = [...(o.individualNotes || Array(o.quantity).fill(''))];
            if (order.quantity > 0) {
              individualNotes = [...individualNotes, ...Array(order.quantity).fill('')];
            } else {
              individualNotes = individualNotes.slice(0, newQuantity);
            }
            
            return {
              ...o,
              quantity: newQuantity,
              individualNotes,
            };
          }
          return o;
        }).filter(Boolean);
      } else {
        updatedOrders = [...existingOrders, {
          ...order,
          individualNotes: Array(order.quantity).fill(''),
        }];
      }
      const updatedTables = state.tables.map((table) => {
        if (table.number === tableNumber) {
          return {
            ...table,
            orders: updatedOrders,
          };
        }
        return table;
      });

      return {
        selectedTable: {
          ...state.selectedTable,
          orders: updatedOrders,
        },
        tables: updatedTables,
      };
    }),

  // Table Operations
  clearTable: (tableNumber) =>
    set((state) => ({
      selectedTable: null,
      tables: state.tables.map((table) =>
        table.number === tableNumber
          ? { ...table, status: "available", orders: [] }
          : table
      ),
    })),

  // Payment Management
  addPaymentHistory: (payment) =>
    set((state) => ({
      paymentHistory: [...state.paymentHistory, payment],
    })),
}));
