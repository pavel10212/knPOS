export const doesTableHaveOrders = (tableNumber, orders) => {
    return orders.some((order) => order.table_num === tableNumber)
}

export const findOrdersForTable = (tableNumber, orders) => {
    return orders.filter((order) => order.table_num === tableNumber)
}