import { ScrollView, View, Alert } from 'react-native';
import TableOrders from '../../components/TableOrders';
import { useSharedStore } from "../../hooks/useSharedStore";
import { findAllOrdersForTable } from "../../utils/orderUtils";

const Order = () => {
    const menu = useSharedStore((state) => state.menu);
    const tables = useSharedStore((state) => state.tables);
    const orders = useSharedStore((state) => state.orders) || [];
    const inventory = useSharedStore((state) => state.inventory);

    const updateOrderInStore = (orderId, updatedOrder) => {
        const currentOrders = useSharedStore.getState().orders || [];
        useSharedStore.getState().setOrders(
            currentOrders.map(o => o.order_id === orderId ? updatedOrder : o)
        );
    };

    const handleOrderDelivery = async (orderId) => {
        const foundOrder = orders.find(o => o.order_id === orderId);
        try {
            const orderDetails = typeof foundOrder.order_details === 'string' 
                ? JSON.parse(foundOrder.order_details) 
                : foundOrder.order_details;

            const updatedOrderDetails = orderDetails.map(item => ({
                ...item,
                status: 'Completed'
            }));

            const response = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:3000/orders-update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: orderId,
                    total_amount: foundOrder.total_amount,
                    order_date_time: foundOrder.order_date_time,
                    order_status: 'Completed',
                    order_details: JSON.stringify(updatedOrderDetails),
                    completion_date_time: new Date().toISOString()
                }),
            });

            if (!response.ok) throw new Error('Delivery failed');
            const updatedOrder = await response.json();
            updateOrderInStore(orderId, updatedOrder);

        } catch (error) {
            console.error('Delivery error:', error);
            Alert.alert('Error', 'Failed to mark order as delivered');
        }
    };

    const handleItemStatusChange = async (orderId, item, newStatus) => {
        const currentOrders = useSharedStore.getState().orders || [];
        const order = currentOrders.find(o => o.order_id === orderId);
        if (!order) return;

        const orderDetails = typeof order.order_details === 'string'
            ? JSON.parse(order.order_details)
            : [...order.order_details];

        const updatedOrderDetails = orderDetails.map(detail => {
            const isMatch = item.type === 'inventory' 
                ? detail.inventory_item_id === item.originalInventoryItemId
                : detail.menu_item_id === item.originalMenuItemId;

            if (isMatch) return { ...detail, status: newStatus };
            return detail;
        });

        const allMenuReady = updatedOrderDetails
            .filter(d => d.type === 'menu')
            .every(d => d.status === 'Ready');
        const allDrinksCompleted = updatedOrderDetails
            .filter(d => d.type === 'inventory')
            .every(d => d.status === 'Completed');
        const newOrderStatus = allMenuReady && allDrinksCompleted ? 'Ready' : 'In Progress';

        try {
            const response = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:3000/orders-update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_id: orderId,
                    order_details: JSON.stringify(updatedOrderDetails),
                    order_status: newOrderStatus,
                    total_amount: order.total_amount,
                    order_date_time: order.order_date_time,
                }),
            });

            if (!response.ok) throw new Error('Failed to update order');
            const updatedOrder = await response.json();
            updateOrderInStore(orderId, updatedOrder);

        } catch (error) {
            console.error('Error updating item status:', error);
            Alert.alert('Error', 'Failed to update item status');
        }
    };

    const tableList = tables.map((table) => ({
        id: table.table_id,
        name: `Table ${table.table_num}`,
        orders: findAllOrdersForTable(table.table_num, orders).map((order) => ({
            id: order.order_id,
            status: order.order_status,
            items: (typeof order.order_details === 'string' 
                ? JSON.parse(order.order_details) 
                : order.order_details).map((item) => {
                if (item.type === 'inventory') {
                    const inventoryItem = inventory.find(inv => inv.inventory_item_id === item.inventory_item_id);
                    return {
                        name: inventoryItem?.inventory_item_name || "Unknown Item",
                        type: 'inventory',
                        originalInventoryItemId: item.inventory_item_id,
                        quantity: item.quantity,
                        status: item.status
                    };
                }
                const menuItem = menu.find(menuItem => menuItem.menu_item_id === item.menu_item_id);
                return {
                    name: menuItem?.menu_item_name || "Unknown Item",
                    type: 'menu',
                    originalMenuItemId: item.menu_item_id,
                    quantity: item.quantity,
                    status: item.status
                };
            })
        }))
    }));

    return (
        <View className="flex-1 bg-[#F3F4F6]">
            <ScrollView>
                <View className="p-4 flex-row flex-wrap">
                    {tableList.map(table => (
                        <TableOrders
                            key={table.id}
                            table={table}
                            onItemStatusChange={handleItemStatusChange}
                            onOrderDelivery={handleOrderDelivery}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

export default Order;