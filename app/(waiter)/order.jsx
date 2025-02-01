import { ScrollView, View } from 'react-native'
import React from 'react'
import TableOrders from '../../components/TableOrders'
import { useSharedStore } from "../../hooks/useSharedStore";
import { findAllOrdersForTable } from "../../utils/orderUtils";

const Order = () => {
    const menu = useSharedStore((state) => state.menu)
    const tables = useSharedStore((state) => state.tables)
    const orders = useSharedStore((state) => state.orders)
    const inventory = useSharedStore((state) => state.inventory)

    const tableList = tables.map((table) => {
        const tableOrders = findAllOrdersForTable(table.table_num, orders)
        return {
            id: table.table_id,
            name: `Table ${table.table_num}`,
            orders: tableOrders.map((order) => {
                const orderDetails = typeof order.order_details === 'string' 
                    ? JSON.parse(order.order_details) 
                    : order.order_details;

                return {
                    id: order.order_id,
                    status: order.order_status,
                    items: orderDetails.map((item) => {
                        if (item.type === 'inventory') {
                            const inventoryItem = inventory.find((inv) => inv.inventory_item_id === item.inventory_item_id);
                            return {
                                name: inventoryItem?.inventory_item_name || "Unknown Item",
                                quantity: item.quantity,
                                price: inventoryItem?.cost_per_unit || 0,
                                status: item.status,
                                type: 'inventory'
                            }
                        } else {
                            const menuItem = menu.find((menuItem) => menuItem.menu_item_id === item.menu_item_id);
                            return {
                                name: menuItem?.menu_item_name || "Unknown Item",
                                quantity: item.quantity,
                                price: menuItem?.price || 0,
                                status: item.status,
                                type: 'menu'
                            }
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
