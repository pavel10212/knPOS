const API_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

export const orderService = {
  async updateOrder(orderId, orderData) {
    // Set emitFromServer to false to use our local-order-updated event instead
    const response = await fetch(
      `${API_URL}/orders-update?emitFromServer=false`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          order_status: orderData.order_status,
          completion_date_time: orderData.completion_date_time,
          total_amount: orderData.total_amount,
          order_details: orderData.order_details,
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to update order");
    return response.json();
  },

  async createOrder(orderData) {
    try {
      const response = await fetch(
        `${API_URL}/orders-insert-admin?skipBroadcast=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
          },
          body: JSON.stringify(orderData),
        }
      );
      if (!response.ok) throw new Error("Failed to place order");
      return response.json()
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async updateOrderNotes(orderId, updatedDetails) {
    const response = await fetch(
      `${API_URL}/orders-update?skipBroadcast=true`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          order_details: JSON.stringify(updatedDetails),
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to update order notes");
    return response.json();
  },

  async fetchTodayOrders() {
    const response = await fetch(`${API_URL}/orders-for-today`, {
      headers: {
        Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch orders");
    return response.json();
  },
};

export const updateOrderStatus = async (order, updatedOrderDetails) => {
  const orderData = {
    order_status: "Completed",
    completion_date_time: new Date().toISOString(),
    order_details: updatedOrderDetails,
    total_amount: order.total_amount,
  };
  return orderService.updateOrder(order.order_id, orderData);
};

export const updateOrderWithPayment = async (
  orderId,
  orderDetails,
  paymentInfo
) => {
  const orderData = {
    total_amount: paymentInfo.total,
    tip_amount: paymentInfo.tipAmount,
    order_status: "Completed",
    completion_date_time: new Date().toISOString(),
    order_details: orderDetails,
  };

  try {
    const response = await fetch(
      `${API_URL}/orders-update?emitFromServer=false`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          ...orderData
        }),
      }
    );

    if (!response.ok) throw new Error("Failed to update order");
    
    const result = await response.json();
    
    // Emit socket event to notify all clients of the update
    useSocketStore.getState().emitLocalOrderUpdated(orderId);
    
    return result;
  } catch (error) {
    console.error("Error updating order with payment:", error);
    throw error;
  }
};

export const updateOrderDelivery = async (order, updatedOrderDetails) => {
  const orderData = {
    total_amount: order.total_amount,
    order_date_time: order.order_date_time,
    order_status: "Ready",
    order_details: JSON.stringify(updatedOrderDetails),
    completion_date_time: new Date().toISOString(),
  };
  return orderService.updateOrder(order.order_id, orderData);
};

export const updateOrderItemStatus = async (
  order,
  updatedOrderDetails,
  newOrderStatus
) => {
  const orderData = {
    order_details: JSON.stringify(updatedOrderDetails),
    order_status: newOrderStatus,
    total_amount: order.total_amount,
    order_date_time: order.order_date_time,
  };
  return orderService.updateOrder(order.order_id, orderData);
};

import { useSharedStore } from "../hooks/useSharedStore";
import { useSocketStore } from "../hooks/useSocket";

export const updateOrder = async (orderId, updateData) => {
  try {
    const response = await fetch(
      `http://${process.env.EXPO_PUBLIC_IP}:3000/orders-update?emitFromServer=false`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_ADMIN_API_KEY}`,
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) throw new Error("Failed to update order");

    const updatedOrder = await response.json();
    const orders = useSharedStore.getState().orders;
    useSharedStore
      .getState()
      .setOrders(
        orders.map((order) =>
          order.order_id === orderId ? updatedOrder : order
        )
      );

    // Emit the socket event instead of using tracking
    useSocketStore.getState().emitLocalOrderUpdated(orderId);
    return true;
  } catch (error) {
    console.error("Error updating order:", error);
    return false;
  }
};
