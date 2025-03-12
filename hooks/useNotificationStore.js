import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      isVisible: false,
      activeToast: null,
      
      addNotification: (notification) => {
        const { notifications } = get();
        const newNotification = {
          id: Date.now().toString(),
          timestamp: new Date(),
          read: false,
          ...notification
        };
        
        set((state) => ({
          notifications: [newNotification, ...notifications].slice(0, 20), // Keep only last 20 notifications
          // Don't automatically show panel anymore, just set the active toast
          activeToast: newNotification
        }));
        
        // Auto-clear the toast after a few seconds
        setTimeout(() => {
          set((state) => {
            // Only clear if it's still the same toast
            if (state.activeToast?.id === newNotification.id) {
              return { activeToast: null };
            }
            return {};
          });
        }, 3000);
        
        return newNotification.id;
      },
      
      clearActiveToast: () => {
        set({ activeToast: null });
      },
      
      markAsRead: (notificationId) => {
        const { notifications } = get();
        const updatedNotifications = notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        );
        
        set({ notifications: updatedNotifications });
      },
      
      markAllAsRead: () => {
        const { notifications } = get();
        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          read: true
        }));
        
        set({ notifications: updatedNotifications });
      },
      
      removeNotification: (notificationId) => {
        const { notifications } = get();
        set({
          notifications: notifications.filter(n => n.id !== notificationId)
        });
      },
      
      clearNotifications: () => {
        set({ notifications: [] });
      },
      
      toggleNotificationPanel: () => {
        set((state) => ({ isVisible: !state.isVisible }));
      },
      
      hideNotificationPanel: () => {
        set({ isVisible: false });
      },
      
      showNotificationPanel: () => {
        set({ isVisible: true });
      }
    }),
    {
      name: "notifications-storage",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);