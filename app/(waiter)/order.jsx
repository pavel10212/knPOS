import { View, Alert, FlatList } from 'react-native';
import TableOrders from '../../components/TableOrders';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useSharedStore } from "../../hooks/useSharedStore";
import { findAllOrdersForTable } from "../../utils/orderUtils";
import { updateOrderDelivery, updateOrderItemStatus } from '../../services/orderService';
import { useState } from 'react';

const Order = () => {
    const [confirmModal, setConfirmModal] = useState({ visible: false, orderId: null });
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
        setConfirmModal({ visible: true, orderId });
    };

    const confirmOrderDelivery = async () => {
        const orderId = confirmModal.orderId;
        const foundOrder = orders.find(o => o.order_id === orderId);

        try {
            const orderDetails = typeof foundOrder.order_details === 'string'
                ? JSON.parse(foundOrder.order_details)
                : foundOrder.order_details;

            const updatedOrderDetails = orderDetails.map(item => ({
                ...item,
                status: 'Completed'
            }));

            const updatedOrder = await updateOrderDelivery(foundOrder, updatedOrderDetails, 'Completed');
            updateOrderInStore(orderId, updatedOrder);
        } catch (error) {
            console.error('Delivery error:', error);
            Alert.alert('Error', 'Failed to mark order as completed');
        } finally {
            setConfirmModal({ visible: false, orderId: null });
        }
    };

    const handleItemStatusChange = async (orderId, item, newStatus) => {
        if (item.status === 'Completed') return;

        const currentOrders = useSharedStore.getState().orders || [];
        const order = currentOrders.find(o => o.order_id === orderId);
        if (!order) return;

        const orderDetails = typeof order.order_details === 'string'
            ? JSON.parse(order.order_details)
            : [...order.order_details];


        const updatedOrderDetails = orderDetails.map(detail => {
            const detailCartItemId = detail.cartItemId || detail.cartItemID;
            const itemCartItemId = item.cartItemId || item.cartItemID;

            if (detailCartItemId === itemCartItemId) {
                return { ...detail, status: newStatus };
            }
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
            const updatedOrder = await updateOrderItemStatus(order, updatedOrderDetails, newOrderStatus);
            updateOrderInStore(orderId, updatedOrder);
        } catch (error) {
            console.error('Error updating item status:', error);
            Alert.alert('Error', 'Failed to update item status');
        }
    };


    const tableList = tables
        .map((table) => {
            const tableOrders = findAllOrdersForTable(table.table_num, orders)
                .filter(order => {
                    const orderDate = new Date(order.order_date_time);
                    const now = new Date();
                    return orderDate.getFullYear() === now.getFullYear() &&
                        orderDate.getMonth() === now.getMonth() &&
                        orderDate.getDate() === now.getDate() &&
                        order.table_token === table.token &&
                        order.order_status !== 'Cancelled'; 
                });

            return {
                id: table.table_id,
                name: `Table ${table.table_num}`,
                tableNum: table.table_num,
                orders: tableOrders.map((order) => ({
                    id: order.order_id,
                    status: order.order_status,
                    order_date_time: order.order_date_time,
                    items: (typeof order.order_details === 'string'
                        ? JSON.parse(order.order_details)
                        : order.order_details).map((item) => {
                            if (item.type === 'inventory') {
                                const inventoryItem = inventory.find(inv => inv.inventory_item_id === item.inventory_item_id);
                                return {
                                    name: inventoryItem?.inventory_item_name || "Unknown Item",
                                    type: 'inventory',
                                    originalInventoryItemId: item.inventory_item_id,
                                    cartItemId: item.cartItemId,
                                    quantity: item.quantity,
                                    status: item.status
                                };
                            }
                            const menuItem = menu.find(menuItem => menuItem.menu_item_id === item.menu_item_id);
                            return {
                                name: menuItem?.menu_item_name || "Unknown Item",
                                type: 'menu',
                                originalMenuItemId: item.menu_item_id,
                                cartItemId: item.cartItemId,
                                quantity: item.quantity,
                                status: item.status
                            };
                        })
                }))
            };
        })
        .sort((a, b) => a.tableNum - b.tableNum);

    return (
        <View className="flex-1 bg-[#F3F4F6]">
            <ConfirmationModal
                visible={confirmModal.visible}
                onConfirm={confirmOrderDelivery}
                onCancel={() => setConfirmModal({ visible: false, orderId: null })}
                title="Mark Order as Completed"
                message="Are you sure you want to complete this order?"
            />
            <FlatList
                horizontal
                data={tableList}
                keyExtractor={table => table.id.toString()}
                renderItem={({ item: table }) => (
                    <TableOrders
                        table={table}
                        onItemStatusChange={handleItemStatusChange}
                        onOrderDelivery={handleOrderDelivery}
                    />
                )}
                showsHorizontalScrollIndicator={false}
                snapToAlignment="start"
                decelerationRate="fast"
                snapToInterval={300}
            />
        </View>
    );
};

export default Order;