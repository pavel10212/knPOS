const API_URL = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

export const updateOrderStatus = async (order, updatedOrderDetails) => {
  const response = await fetch(`${API_URL}/orders-update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: order.order_id,
      order_status: "Completed",
      completion_date_time: new Date().toISOString(),
      order_details: updatedOrderDetails,
      total_amount: order.total_amount,
    }),
  });

  if (!response.ok) throw new Error("Failed to update order");
  return response.json();
};

export const updateOrderWithPayment = async (
  orderId,
  orderDetails,
  paymentInfo
) => {
  const response = await fetch(`${API_URL}/orders-update`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: orderId,
      total_amount: paymentInfo.total,
      tip_amount: paymentInfo.tipAmount,
      order_status: "Completed",
      completion_date_time: new Date().toISOString(),
      order_details: orderDetails,
    }),
  });

  if (!response.ok) throw new Error("Failed to update order");
  return response.json();
};

export const updateOrderDelivery = async (order, updatedOrderDetails) => {
  const response = await fetch(`${API_URL}/orders-update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: order.order_id,
      total_amount: order.total_amount,
      order_date_time: order.order_date_time,
      order_status: 'Ready',  // Changed from 'Completed' to 'Ready'
      order_details: JSON.stringify(updatedOrderDetails),
      completion_date_time: new Date().toISOString()
    }),
  });

  if (!response.ok) throw new Error('Delivery status update failed');
  return response.json();
};

export const updateOrderItemStatus = async (order, updatedOrderDetails, newOrderStatus) => {
  const response = await fetch(`${API_URL}/orders-update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order_id: order.order_id,
      order_details: JSON.stringify(updatedOrderDetails),
      order_status: newOrderStatus,
      total_amount: order.total_amount,
      order_date_time: order.order_date_time,
    }),
  });

  if (!response.ok) throw new Error('Failed to update order');
  return response.json();
};
