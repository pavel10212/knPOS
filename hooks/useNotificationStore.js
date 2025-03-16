import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      isVisible: false,
      activeToast: null,
      pendingCount: 0, // Count of unresolved urgent notifications
      
      addNotification: (notification) => {
        const { notifications } = get();
        const newNotification = {
          id: Date.now().toString(),
          timestamp: new Date(),
          read: false,
          isPersistent: notification.isPersistent || false,
          ...notification
        };
        
        // Update pending count for persistent notifications
        if (newNotification.isPersistent) {
          set(state => ({ pendingCount: state.pendingCount + 1 }));
        }
        
        set((state) => ({
          notifications: [newNotification, ...notifications].slice(0, 50), // Keep more notifications
          // Don't automatically show panel anymore, just set the active toast
          activeToast: newNotification
        }));
        
        // Auto-clear the toast after a few seconds (except for persistent notifications)
        if (!newNotification.isPersistent) {
          setTimeout(() => {
            set((state) => {
              // Only clear if it's still the same toast
              if (state.activeToast?.id === newNotification.id) {
                return { activeToast: null };
              }
              return {};
            });
          }, 3000);
        }
        
        return newNotification.id;
      },
      
      clearActiveToast: () => {
        set({ activeToast: null });
      },
      
      markAsRead: (notificationId) => {
        const { notifications } = get();
        const notification = notifications.find(n => n.id === notificationId);
        
        // If it's a persistent notification that's being marked as read,
        // we need to decrement pending count if we haven't already
        const isPersistentUnread = notification?.isPersistent && !notification.read;
        
        const updatedNotifications = notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        );
        
        set(state => ({ 
          notifications: updatedNotifications,
          pendingCount: isPersistentUnread ? Math.max(0, state.pendingCount - 1) : state.pendingCount
        }));
      },
      
      markAllAsRead: () => {
        const { notifications } = get();
        
        // Count persistent notifications that are being marked as read
        const persistentUnreadCount = notifications.filter(n => n.isPersistent && !n.read).length;
        
        const updatedNotifications = notifications.map(notification => ({
          ...notification,
          read: true
        }));
        
        set(state => ({
          notifications: updatedNotifications,
          pendingCount: Math.max(0, state.pendingCount - persistentUnreadCount)
        }));
      },
      
      removeNotification: (notificationId) => {
        const { notifications } = get();
        const notification = notifications.find(n => n.id === notificationId);
        
        // If it's a persistent notification being removed, decrement pending count if not read
        const isPersistentUnread = notification?.isPersistent && !notification.read;
        
        set(state => ({
          notifications: notifications.filter(n => n.id !== notificationId),
          pendingCount: isPersistentUnread ? Math.max(0, state.pendingCount - 1) : state.pendingCount
        }));
      },
      
      clearNotifications: () => {
        // Count all unread persistent notifications that will be cleared
        const { notifications } = get();
        const persistentUnreadCount = notifications.filter(n => n.isPersistent && !n.read).length;
        
        set(state => ({ 
          notifications: [],
          pendingCount: 0 // Reset pending count as we're clearing all notifications
        }));
      },
      
      toggleNotificationPanel: () => {
        set((state) => ({ isVisible: !state.isVisible }));
      },
      
      hideNotificationPanel: () => {
        set({ isVisible: false });
      },
      
      showNotificationPanel: () => {
        set({ isVisible: true });
      },
      
      // New methods for handling persistent notifications
      getPendingNotifications: () => {
        return get().notifications.filter(n => n.isPersistent && !n.read);
      },
      
      resolveTableRequest: (tableNum) => {
        const { notifications } = get();
        let updatedPendingCount = get().pendingCount;
        
        // Mark all notifications for this table as read
        const updatedNotifications = notifications.map(notification => {
          if (notification.tableNum === tableNum && notification.isPersistent && !notification.read) {
            updatedPendingCount--;
            return { ...notification, read: true, resolved: true };
          }
          return notification;
        });
        
        set({
          notifications: updatedNotifications,
          pendingCount: Math.max(0, updatedPendingCount)
        });
      }
    }),
    {
      name: "notifications-storage",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);