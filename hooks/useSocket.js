import { create } from "zustand";
import { loginStore } from "./useStore";
import io from "socket.io-client";
import Toast from "react-native-toast-message";
import { useSharedStore } from "./useSharedStore";
import { useReservationStore } from "./useReservationStore";
import { useNotificationStore } from "./useNotificationStore";

const SOCKET_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

// Constants for notification types with persistence requirements
const PERSISTENT_NOTIFICATION_TYPES = {
  BILL_REQUEST: 'bill-request',
  TABLE_CALL: 'table-call'
};

export const useSocketStore = create((set, get) => ({
  socket: null,
  error: null,
  pendingRequests: [], // Store for persistent notifications that need attention

  initializeSocket: () => {
    const { socket } = get();
    if (socket) return;

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"], // Allow both WebSocket and polling
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      set({ error: "Socket connection error" });
    });

    newSocket.on("order-updated", (data) => {
      const currentOrders = useSharedStore.getState().orders;
      const role = loginStore.getState().role;
      const updatedOrder = {
        ...data,
        order_details:
          typeof data.order_details === "string"
            ? JSON.parse(data.order_details)
            : data.order_details,
      };

      const updatedOrders = currentOrders.map((order) =>
        order.order_id === data.order_id ? updatedOrder : order
      );

      useSharedStore.getState().setOrders(updatedOrders);

      if (role === "waiter") {
        // Add to notification store only
        useNotificationStore.getState().addNotification({
          type: "info",
          text1: "Order Updated",
          text2: `Order ${data.order_id} has been updated`,
        });
      }
    });

    newSocket.on("status-update", (data) => {
      const tables = useSharedStore.getState().tables;
      const setTables = useSharedStore.getState().setTables;
      const role = loginStore.getState().role;

      const newTables = [
        ...tables.filter((table) => table.table_num !== data.table_num),
        data,
      ];

      setTables(newTables);

      if (role === "waiter") {
        // Add to notification store only
        useNotificationStore.getState().addNotification({
          type: "info",
          text1: "Table Status Updated",
          text2: `Table ${data.table_num} is now ${data.status}`,
        });
      }
    });

    newSocket.on("call-waiter", () => {
      const role = loginStore.getState().role;

      if (role === "waiter") {
        // Add to notification store with higher visibility
        useNotificationStore.getState().addNotification({
          type: "warning",
          text1: "Waiter Alert",
          text2: "The kitchen has called for a waiter",
        });
      }
    });

    newSocket.on("table-call-waiter", (table_token) => {
      const role = loginStore.getState().role;
      const tables = useSharedStore.getState().tables;

      const table_num = tables.find(
        (table) => table.token === table_token
      )?.table_num;

      if (role === "waiter") {
        // Add to notification store with higher visibility and mark as persistent
        const notificationId = useNotificationStore.getState().addNotification({
          type: "warning",
          text1: "⚠️ URGENT: Table Needs Assistance",
          text2: `Table ${table_num || 'Unknown'} has called for a waiter`,
          isPersistent: true,
          notificationType: PERSISTENT_NOTIFICATION_TYPES.TABLE_CALL,
          tableNum: table_num || 'Unknown',
        });

        // Add to pending requests for persistent reminder
        const pendingRequests = get().pendingRequests;
        set({
          pendingRequests: [
            ...pendingRequests,
            {
              id: notificationId,
              type: PERSISTENT_NOTIFICATION_TYPES.TABLE_CALL,
              tableNum: table_num || 'Unknown',
              timestamp: new Date(),
            }
          ]
        });

        // Also show a toast for immediate attention
        Toast.show({
          type: 'warning',
          text1: '⚠️ Table Calling Waiter',
          text2: `Table ${table_num || 'Unknown'} needs assistance`,
          visibilityTime: 6000,
          autoHide: true,
        });
      }
    });

    newSocket.on("table-call-waiter-for-bill", (table_token) => {
      const role = loginStore.getState().role;
      const tables = useSharedStore.getState().tables;

      const table_num = tables.find(
        (table) => table.token === table_token
      )?.table_num;

      if (role === "waiter") {
        // Add to notification store with higher visibility and mark as persistent/urgent
        const notificationId = useNotificationStore.getState().addNotification({
          type: "error", // Using error type for highest visibility
          text1: "🔴 URGENT: Bill Request",
          text2: `Table ${table_num || 'Unknown'} is waiting for the bill`,
          isPersistent: true,
          notificationType: PERSISTENT_NOTIFICATION_TYPES.BILL_REQUEST,
          tableNum: table_num || 'Unknown',
        });

        // Add to pending requests for persistent reminder
        const pendingRequests = get().pendingRequests;
        set({
          pendingRequests: [
            ...pendingRequests,
            {
              id: notificationId,
              type: PERSISTENT_NOTIFICATION_TYPES.BILL_REQUEST,
              tableNum: table_num || 'Unknown',
              timestamp: new Date(),
            }
          ]
        });

        // Also show a toast for immediate attention
        Toast.show({
          type: 'error',
          text1: '🔴 Bill Request',
          text2: `Table ${table_num || 'Unknown'} is waiting for the bill`,
          visibilityTime: 6000,
          autoHide: true,
        });
      }
    });

    newSocket.on("table-reset", (data) => {
      const tables = useSharedStore.getState().tables;
      const setTables = useSharedStore.getState().setTables;

      const newTables = [
        ...tables.filter((table) => table.table_num !== data.table_num),
        data,
      ];

      setTables(newTables);

      // Add to notification store only
      useNotificationStore.getState().addNotification({
        type: "info",
        text1: "Table Status Updated",
        text2: `Table ${data.table_num} token has been reset`,
      });

      // Remove any pending requests for this table
      const pendingRequests = get().pendingRequests;
      const filteredRequests = pendingRequests.filter(
        req => req.tableNum !== data.table_num.toString()
      );
      
      if (filteredRequests.length !== pendingRequests.length) {
        set({ pendingRequests: filteredRequests });
      }
    });

    newSocket.on("new-order", (data) => {
      console.log("New order received from socket:", data);

      // Process the order
      const currentOrders = useSharedStore.getState().orders;
      const processedOrder = {
        ...data,
        order_details:
          typeof data.order_details === "string"
            ? JSON.parse(data.order_details)
            : data.order_details,
      };

      // Update state and storage
      const updatedOrders = [...currentOrders, processedOrder];
      useSharedStore.getState().setOrders(updatedOrders);

      // Add to notification store only
      useNotificationStore.getState().addNotification({
        type: "success",
        text1: "New Order Received",
        text2: `Table ${data.table_num}`,
      });
    });

    // Reservation socket events
    newSocket.on("new-reservation", (data) => {
      console.log("New reservation received from socket:", data);
      const reservationStore = useReservationStore.getState();
      const role = loginStore.getState().role;

      // Process the reservation - add to store states
      const reservationDate = new Date(data.reservation_time).toISOString().split("T")[0];
      const isForToday = isToday(data.reservation_time);

      // Add to appropriate collections
      reservationStore.fetchAllReservationData(true);

      if (role === "waiter") {
        // Add to notification store only
        useNotificationStore.getState().addNotification({
          type: "success",
          text1: "New Reservation",
          text2: `${data.customer_name} - ${new Date(data.reservation_time).toLocaleTimeString()}`,
        });
      }
    });

    newSocket.on("reservation-updated", (data) => {
      console.log("Reservation update received from socket:", data);
      const reservationStore = useReservationStore.getState();
      const role = loginStore.getState().role;

      // Process the reservation update - update in store
      reservationStore.fetchAllReservationData(true);

      if (role === "waiter") {
        // Add to notification store only
        useNotificationStore.getState().addNotification({
          type: "info",
          text1: "Reservation Updated",
          text2: `${data.customer_name} - Table ${data.table_id}`,
        });
      }
    });

    newSocket.on("reservation-deleted", (data) => {
      console.log("Reservation deletion received from socket:", data);
      const reservationStore = useReservationStore.getState();
      const role = loginStore.getState().role;

      // Process the reservation deletion
      reservationStore.fetchAllReservationData(true);

      if (role === "waiter") {
        // Add to notification store only
        useNotificationStore.getState().addNotification({
          type: "info",
          text1: "Reservation Cancelled",
          text2: `Reservation #${data.reservation_id} was deleted`,
        });
      }
    });

    set({ socket: newSocket });
    
    // Set up the reminder interval for pending requests
    const reminderInterval = setInterval(() => {
      const pendingRequests = get().pendingRequests;
      if (pendingRequests.length > 0) {
        // Send reminder notifications for pending requests
        pendingRequests.forEach(req => {
          const timeSinceRequest = (new Date() - new Date(req.timestamp)) / 1000 / 60; // minutes
          
          // Remind every 2 minutes for bill requests, 4 minutes for regular table calls
          const reminderInterval = req.type === PERSISTENT_NOTIFICATION_TYPES.BILL_REQUEST ? 2 : 4;
          
          if (timeSinceRequest >= reminderInterval && timeSinceRequest % reminderInterval < 1) {
            // It's time for a reminder
            const urgencyPrefix = req.type === PERSISTENT_NOTIFICATION_TYPES.BILL_REQUEST ? 
              '🔴 REMINDER: Bill Request' : '⚠️ REMINDER: Table Waiting';
              
            useNotificationStore.getState().addNotification({
              type: req.type === PERSISTENT_NOTIFICATION_TYPES.BILL_REQUEST ? "error" : "warning",
              text1: urgencyPrefix,
              text2: `Table ${req.tableNum} has been waiting for ${Math.floor(timeSinceRequest)} minutes`,
              isPersistent: true,
            });
            
            // Also show a toast for immediate attention
            Toast.show({
              type: req.type === PERSISTENT_NOTIFICATION_TYPES.BILL_REQUEST ? 'error' : 'warning',
              text1: urgencyPrefix,
              text2: `Table ${req.tableNum} waiting for ${Math.floor(timeSinceRequest)} min`,
              visibilityTime: 4000,
              autoHide: true,
            });
          }
        });
      }
    }, 60000); // Check every minute

    return () => {
      if (newSocket) {
        newSocket.disconnect();
        set({ socket: null });
      }
      clearInterval(reminderInterval);
    };
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  callWaiterSocket: () => {
    const { socket } = get();
    if (!socket) {
      console.error("Socket not initialized");
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Unable to call waiter - not connected",
      });
      return;
    }

    if (!socket.connected) {
      console.error("Socket not connected");
      Toast.show({
        type: "error",
        text1: "Connection Error",
        text2: "Unable to call waiter - reconnecting...",
      });
      socket.connect();
      return;
    }

    socket.emit("kitchen-call-waiter", (error) => {
      if (error) {
        useNotificationStore.getState().addNotification({
          type: "error",
          text1: "Error",
          text2: "Failed to call waiter",
        });
      }
    });
  },

  // Clear a pending request when it's been handled
  clearPendingRequest: (tableNum) => {
    const pendingRequests = get().pendingRequests;
    const filteredRequests = pendingRequests.filter(
      req => req.tableNum !== tableNum
    );
    set({ pendingRequests: filteredRequests });
  },

  // Get list of tables with pending requests for display
  getPendingRequestTables: () => {
    return get().pendingRequests.map(req => ({
      tableNum: req.tableNum,
      type: req.type,
      timestamp: req.timestamp
    }));
  },

  emitLocalOrderProcessed: (orderId) => {
    const { socket } = get();
    if (!socket || !socket.connected) {
      console.error("Socket not connected, can't emit local order processed");
      return;
    }

    console.log(`Emitting local-order-processed for order ${orderId}`);
    socket.emit("local-order-processed", { orderId });
  },

  emitLocalOrderUpdated: (orderId) => {
    const { socket } = get();
    if (!socket || !socket.connected) {
      console.error("Socket not connected, can't emit local order updated");
      return;
    }

    console.log(`Emitting local-order-updated for order ${orderId}`);
    socket.emit("local-order-updated", { orderId });
  },

}));

// Helper function to check if a date is today
function isToday(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
