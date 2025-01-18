export const doesTableHaveOrders = (tableNumber, orders) => {
    const tableOrders = orders.filter((order) => order.table_num === tableNumber)
    const incompleteOrders = tableOrders.filter((order) => order.order_status !== 'Completed')
    return incompleteOrders.length > 0
}

export const findOrdersForTable = (tableNumber, orders) => {
    const allOrders = orders.filter((order) => order.table_num === tableNumber)
    const incompleteOrders = allOrders.filter((order) => order.order_status !== 'Completed')
    return incompleteOrders
}
