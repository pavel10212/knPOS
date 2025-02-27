export const parseOrderDetails = (orderDetails) => {
  try {
    return typeof orderDetails === 'string'
      ? JSON.parse(orderDetails)
      : Array.isArray(orderDetails)
        ? orderDetails
        : [];
  } catch (error) {
    console.error('Failed to parse order details:', error);
    return [];
  }
};

export const createMenuItemsMap = (menuItems) => {
  return (menuItems || []).reduce((map, item) => {
    map[item.menu_item_id] = item;
    return map;
  }, {});
};

export const getInitialCheckedItems = (orders) => {
  const checkedState = {};
  orders.forEach(order => {
    if (!order || !order.order_details) return;
    
    const details = parseOrderDetails(order.order_details);
    details.forEach(item => {
      const cartItemId = item.cartItemId || item.cartItemID;
      if (cartItemId) {
        checkedState[`${order.order_id}-${cartItemId}`] = item.status === 'Completed';
      }
    });
  });
  return checkedState;
};

export const deduplicateOrders = (orders) => {
  if (!orders) return [];
  // Use a Map to track unique order IDs
  const uniqueOrdersMap = new Map();
  orders.forEach(order => {
    if (order && !uniqueOrdersMap.has(order.order_id)) {
      uniqueOrdersMap.set(order.order_id, order);
    }
  });
  return Array.from(uniqueOrdersMap.values());
};
