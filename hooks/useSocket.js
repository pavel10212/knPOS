import { create } from "zustand";
import io from "socket.io-client";
import Toast from "react-native-toast-message";
import { useSharedStore } from "./useSharedStore";
import { localStore } from "./Storage/cache";

const SOCKET_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

export const useSocketStore = create((set, get) => ({
    socket: null,
    error: null,
    recentlyProcessedOrders: new Set(),

    initializeSocket: () => {
        const { socket, recentlyProcessedOrders } = get();
        if (socket) return;

        const newSocket = io(SOCKET_URL, {
            transports: ["polling"],
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

        newSocket.on("new-order", async (newOrder) => {
            // Check if we've recently processed this order
            if (recentlyProcessedOrders.has(newOrder.order_id)) {
                console.log("Skipping duplicate order:", newOrder.order_id);
                return;
            }

            console.log("New order received:", newOrder);

            // Get current orders from localStorage and state
            const currentOrders = useSharedStore.getState().orders;

            // Ensure order_details is properly parsed
            const processedOrder = {
                ...newOrder,
                order_details:
                    typeof newOrder.order_details === "string"
                        ? JSON.parse(newOrder.order_details)
                        : newOrder.order_details,
            };

            // Create new orders array
            const updatedOrders = [...currentOrders, processedOrder];

            // Update localStorage
            localStore.set("orders", JSON.stringify(updatedOrders));

            Toast.show({
                type: "success",
                text1: "New order received",
                text2: `Table ${newOrder.table_num}`,
            });

            // Update global state
            useSharedStore.getState().setOrders(updatedOrders);
        });

        set({ socket: newSocket });
        return () => {
            if (newSocket) {
                newSocket.disconnect();
                set({ socket: null });
            }
        };
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null });
        }
    },

    trackProcessedOrder: (orderId) => {
        const { recentlyProcessedOrders } = get();
        recentlyProcessedOrders.add(orderId);
        setTimeout(() => {
            recentlyProcessedOrders.delete(orderId);
        }, 5000);
    }
}));