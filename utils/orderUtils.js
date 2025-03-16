export const doesTableHaveOrders = (tableNumber, orders) => {
    const tableOrders = orders.filter((order) => String(order.table_num) === String(tableNumber))
    const activeOrders = tableOrders.filter((order) => 
        order.order_status !== 'Completed' && 
        order.order_status !== 'Cancelled'
    )
    return activeOrders.length > 0
}

export const findOrdersForTable = (tableNumber, orders) => {
    const allOrders = orders.filter((order) => String(order.table_num) === String(tableNumber))
    return allOrders.filter((order) => 
        order.order_status !== 'Completed' && 
        order.order_status !== 'Cancelled'
    )
}

export const findAllOrdersForTable = (tableNumber, orders) => {
    return orders.filter((order) => String(order.table_num) === String(tableNumber))
}
