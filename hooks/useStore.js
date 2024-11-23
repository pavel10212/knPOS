import { create } from "zustand";

export const loginStore = create((set) => ({
  role: "waiter",
  setRole: (role) => set({ role }),
  isLoggedIn: false,
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
}));

export const tableStore = create((set) => ({
  selectedTable: null,
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
          { name: "Apple Pie", quantity: 1, notes: "Extra Caramel", price: 5.99 },
          { name: "Chocolate Cake", quantity: 1, notes: "Extra Chocolate", price: 6.99 },
          { name: "Ice Cream", quantity: 1, notes: "Extra Sprinkles", price: 4.99 },
          { name: "Coffee", quantity: 1, notes: "Extra Sugar", price: 1.99 },
        ],
      },
    }),
}));
