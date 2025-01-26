import { ScrollView, View } from 'react-native'
import React from 'react'
import TableOrders from '../../components/TableOrders'
import { useSharedStore } from "../../hooks/useSharedStore";
import { findAllOrdersForTable } from "../../utils/orderUtils";


const Order = () => {
    const menu = useSharedStore((state) => state.menu)
    const tables = useSharedStore((state) => state.tables)
    const orders = useSharedStore((state) => state.orders)


    const tableList = tables.map((table) => {
        const tableOrders = findAllOrdersForTable(table.table_num, orders)
        return {
            id: table.table_id,
            name: `Table ${table.table_num}`,
            orders: tableOrders.map((order) => {
                return {
                    id: order.order_id,
                    status: order.order_status,
                    items: order.order_details.map((item) => {
                        const menuItem = menu.menuItems.find((menuItem) => menuItem.menu_item_id === item.menu_item_id)
                        return {
                            name: menuItem.menu_item_name,
                            quantity: item.quantity,
                            price: menuItem.price,
                            status: item.status
                        }
                    })
                }
            })
        }
    })

    return (
        <View className="flex-1 bg-[#F3F4F6]">
            <ScrollView>
                <View className="p-4 flex-row flex-wrap">
                    {tableList.map(table => (
                        <TableOrders key={table.id} table={table} />
                    ))}
                </View>
            </ScrollView>
        </View>
    )
}

export default Order
