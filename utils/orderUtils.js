export const doesTableHaveOrders = (tableNumber, orders) => {
    const tableOrders = orders.filter((order) => String(order.table_num) === String(tableNumber))
    const incompleteOrders = tableOrders.filter((order) => order.order_status !== 'Completed')
    return incompleteOrders.length > 0
}

export const findOrdersForTable = (tableNumber, orders) => {
    const allOrders = orders.filter((order) => String(order.table_num) === String(tableNumber))
    return allOrders.filter((order) => order.order_status !== 'Completed')
}

export const findAllOrdersForTable = (tableNumber, orders) => {
    return orders.filter((order) => String(order.table_num) === String(tableNumber))
}
