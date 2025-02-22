export const parseOrderDetails = (details) => {
    if (!details) return [];
    try {
        return typeof details === 'string' ? JSON.parse(details) : details;
    } catch (error) {
        console.error('Error parsing order details:', error);
        return [];
    }
};

export const createMenuItemsMap = (menu) => {
    if (!menu?.length) return {};
    return menu.reduce((acc, item) => {
        acc[item.menu_item_id] = item;
        return acc;
    }, {});
};

export const getInitialCheckedItems = (orders) => {
    if (!orders?.length) return {};
    
    const checkedItems = {};
    const flatOrders = orders.flat(); // Flatten nested arrays
    
    flatOrders.forEach(order => {
        if (!order?.order_details) return;
        
        const details = parseOrderDetails(order.order_details);
        if (!Array.isArray(details)) return;
        
        details.forEach((item, index) => {
            if (item.status === 'Ready') {
                checkedItems[`${order.order_id}-${index}`] = true;
            }
        });
    });
    
    return checkedItems;
};

export const deduplicateOrders = (orders) => {
    if (!orders?.length) return [];
    
    const flatOrders = Array.isArray(orders) ? orders.flat() : orders;
    const orderMap = new Map();
    
    flatOrders.forEach(order => {
        if (!order?.order_id) return;
        // Keep the most recent version of duplicate orders
        if (!orderMap.has(order.order_id) || 
            new Date(order.order_date_time) > new Date(orderMap.get(order.order_id).order_date_time)) {
            orderMap.set(order.order_id, order);
        }
    });
    
    return Array.from(orderMap.values());
};
