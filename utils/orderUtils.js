export const doesTableHaveOrders = (tableNumber, orders) => {
    const tableOrders = orders.filter((order) => String(order.table_num) === String(tableNumber))
    const incompleteOrders = tableOrders.filter((order) => order.order_status !== 'Completed')
    return incompleteOrders.length > 0
}

export const findOrdersForTable = (tableNumber, orders) => {
    const allOrders = orders.filter((order) => String(order.table_num) === String(tableNumber))
    const incompleteOrders = allOrders.filter((order) => order.order_status !== 'Completed')
    console.log('Incomplete Orders:', incompleteOrders)
    return incompleteOrders
}