export const parseOrderDetails = (details) =>
  typeof details === 'string' ? JSON.parse(details) : details;

export const createMenuItemsMap = (menuItems) =>
  menuItems?.reduce((acc, item) => {
    acc[item.menu_item_id] = item;
    return acc;
  }, {}) || {};

export const getInitialCheckedItems = (orders) => {
  const initialState = {};
  orders.forEach(order => {
    const details = parseOrderDetails(order.order_details);
    details.forEach((item, index) => {
      if (item.status === 'Ready') {
        initialState[`${order.order_id}-${index}`] = true;
      }
    });
  });
  return initialState;
};
