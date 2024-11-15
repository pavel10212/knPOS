import { create } from 'zustand';

const useStore = create((set) => ({
  role: "waiter",
  setRole: (role) => set({ role }),
}));

export default useStore;
