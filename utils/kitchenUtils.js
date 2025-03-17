export const parseOrderDetails = (orderDetails) => {
  try {
    // If orderDetails is undefined or null, return empty array
    if (!orderDetails) {
      console.warn('Order details is null or undefined');
      return [];
    }

    // If it's a string, try to parse it
    if (typeof orderDetails === 'string') {
      try {
        const parsed = JSON.parse(orderDetails);
        if (!Array.isArray(parsed)) {
          console.warn('Parsed order details is not an array');
          return [];
        }
        return parsed;
      } catch (error) {
        console.error('Failed to parse order details string:', error);
        return [];
      }
    }

    // If it's already an array, use it
    if (Array.isArray(orderDetails)) {
      return orderDetails;
    }

    console.warn('Order details is neither string nor array:', typeof orderDetails);
    return [];
  } catch (error) {
    console.error('Unexpected error parsing order details:', error);
    return [];
  }
};

export const createMenuItemsMap = (menuItems) => {
  if (!Array.isArray(menuItems)) {
    console.warn('menuItems is not an array');
    return {};
  }

  return menuItems.reduce((map, item) => {
    if (item && item.menu_item_id) {
      map[item.menu_item_id] = item;
    }
    return map;
  }, {});
};

export const getInitialCheckedItems = (orders) => {
  if (!Array.isArray(orders)) {
    console.warn('orders is not an array');
    return {};
  }

  const checkedState = {};
  orders.forEach(order => {
    if (!order) return;
    
    const details = parseOrderDetails(order.order_details);
    details.forEach(item => {
      if (!item) return;
      
      const cartItemId = item.cartItemId || item.cartItemID;
      if (cartItemId && order.order_id) {
        checkedState[`${order.order_id}-${cartItemId}`] = item.status === 'Completed';
      }
    });
  });
  return checkedState;
};

export const deduplicateOrders = (orders) => {
  if (!Array.isArray(orders)) {
    console.warn('orders is not an array');
    return [];
  }
  return orders.filter(Boolean); // Remove any null/undefined orders
};
