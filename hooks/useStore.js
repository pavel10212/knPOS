import { create } from "zustand";

export const loginStore = create((set) => ({
  role: "waiter",
  setRole: (role) => set({ role }),
  isLoggedIn: false,
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
}));

export const tableStore = create((set) => ({
  selectedTable: null,
  dropdownTableNumber: null, 
  selectTable: (table) =>
    set({
      selectedTable: {
        ...table,
        orders: [
          {
            name: "Chicken Wings",
            quantity: 2,
            notes: "Not Spicy",
            price: 15.99,
          },
          {
            name: "Chicken Salad",
            quantity: 1,
            notes: "Extra Dressing",
            price: 12.99,
          },
          {
            name: "Cheese Burger Beef",
            quantity: 1,
            notes: "No Onions",
            price: 16.99,
          },
          {
            name: "Pasta Carbonara",
            quantity: 1,
            notes: "Extra Cheese",
            price: 17.99,
          },
          { name: "Coca Cola", quantity: 2, notes: "No Ice", price: 2.99 },
          { name: "Water", quantity: 1, notes: "No Ice", price: 0.99 },
          {
            name: "Apple Pie",
            quantity: 1,
            notes: "Extra Caramel",
            price: 5.99,
          },
          {
            name: "Chocolate Cake",
            quantity: 1,
            notes: "Extra Chocolate",
            price: 6.99,
          },
          {
            name: "Ice Cream",
            quantity: 1,
            notes: "Extra Sprinkles",
            price: 4.99,
          },
          { name: "Coffee", quantity: 1, notes: "Extra Sugar", price: 1.99 },
        ],
      },
    }),
  setDropdownTable: (tableNumber) => set({ dropdownTableNumber: tableNumber }), // Add this method
  updateTableStatus: (tableNumber, newStatus) => 
    set((state) => {
      if (state.selectedTable?.number === tableNumber) {
        return {
          selectedTable: { ...state.selectedTable, status: newStatus }
        };
      }
      return {};
    }),
  tables: [
    { number: 1, persons: 2, status: 'unavailable', reservation: null },
    { number: 2, persons: 4, status: 'available', reservation: null },
    { number: 3, persons: 2, status: 'reserved', reservation: null },
    { number: 4, persons: 4, status: 'available', reservation: null },
    { number: 5, persons: 2, status: 'unavailable', reservation: null },
    { number: 6, persons: 4, status: 'available', reservation: null },
    { number: 7, persons: 4, status: 'reserved', reservation: null },
    { number: 8, persons: 2, status: 'available', reservation: null },
    { number: 9, persons: 4, status: 'unavailable', reservation: null }
  ],
  updateTableStatus: (tableNumber, newStatus) => 
    set((state) => ({
      tables: state.tables.map(table => 
        table.number === tableNumber ? { ...table, status: newStatus } : table
      )
    })),
  updateTableReservation: (tableNumber, reservationData) => 
    set((state) => {
      const updatedTables = state.tables.map(table => 
        table.number === tableNumber 
          ? { 
              ...table, 
              status: 'reserved',
              reservation: {
                customerName: reservationData.customerName,
                time: reservationData.time,
                description: reservationData.description,
                reservedAt: reservationData.reservedAt
              }
            } 
          : table
      );
      
      return {
        tables: updatedTables,
        selectedTable: updatedTables.find(t => t.number === tableNumber)
      };
    }),
  reservationModal: { visible: false, tableNumber: null },
  setReservationModal: (modalState) => set({ reservationModal: modalState }),
  handleReservation: (tableNumber) => set({ 
    reservationModal: { visible: true, tableNumber } 
  }),
}));
