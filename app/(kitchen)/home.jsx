import React, { useState, useMemo, useCallback, Suspense, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View, Image, FlatList } from "react-native";
import Header from "../../components/Header";
import { useSocketStore } from "../../hooks/useSocket";
import { useKitchenData } from "../../hooks/useKitchenData";
import { useSharedStore } from "../../hooks/useSharedStore";
import { loginStore } from "../../hooks/useStore";
import icons from "../../constants/icons";
import { router } from "expo-router";
import { parseOrderDetails, createMenuItemsMap, getInitialCheckedItems, deduplicateOrders } from "../../utils/kitchenUtils";
import { updateOrder } from "../../services/orderService";
import { Ionicons } from "@expo/vector-icons";

// Time formatter for order cards
const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const orderTime = new Date(timestamp);
    const now = new Date();
    const diffMs = now - orderTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m ago`;
    }
};

const KitchenOrderItem = React.memo(({ item, isChecked, onToggle }) => {
    return (
        <View className="p-3 rounded-lg bg-gray-50 mr-2 border-l-4 border-l-primary" style={{ width: 250 }}>
            <View className="flex-row justify-between items-center">
                <View className="flex-1 mr-2">
                    <Text className="text-base font-semibold">{item.name}</Text>
                    <Text className="text-sm text-gray-500">
                        Quantity: {item.quantity}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={onToggle}
                    className={`p-2 rounded-full ${isChecked ? 'bg-green-100' : 'bg-gray-200'}`}
                >
                    <Ionicons
                        name={isChecked ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={isChecked ? "#22C55E" : "#6B7280"}
                    />
                </TouchableOpacity>
            </View>
            {item.notes && (
                <View className="mt-2 bg-white p-2 rounded border border-gray-100">
                    <Text className="text-sm text-gray-600">
                        <Text className="font-medium">Note: </Text>
                        {item.notes}
                    </Text>
                </View>
            )}
        </View>
    );
});

const KitchenOrder = React.memo(({ order, checkedItems, onToggleCheck }) => {
    // Calculate completion percentage
    const totalItems = order.items.length;
    const completedItems = order.items.filter(item =>
        checkedItems[`${order.id}-${item.cartItemId}`]
    ).length;
    const completionPercentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    // Determine urgency based on time since order was placed
    const orderTime = new Date(order.timestamp);
    const now = new Date();
    const diffMins = Math.floor((now - orderTime) / 60000);

    let urgencyClass = "bg-green-100 text-green-800";
    if (diffMins > 20) {
        urgencyClass = "bg-red-100 text-red-800";
    } else if (diffMins > 10) {
        urgencyClass = "bg-yellow-100 text-yellow-800";
    }

    return (
        <View className="bg-white rounded-xl shadow-md p-4 border border-gray-100 mb-4 w-full">
            <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <View>
                    <Text className="text-xl font-bold text-primary">
                        Table {order.tableNum}
                    </Text>
                    <Text className="text-sm text-gray-500">
                        Order #{order.id} • {formatTime(order.timestamp)}
                    </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${urgencyClass}`}>
                    <Text className="font-medium">
                        {diffMins > 20 ? "Urgent" : diffMins > 10 ? "Attention" : "New Order"}
                    </Text>
                </View>
            </View>

            {/* Progress bar */}
            <View className="h-2 bg-gray-200 rounded-full mb-3">
                <View
                    className="h-2 bg-primary rounded-full"
                    style={{ width: `${completionPercentage}%` }}
                />
            </View>

            <View className="mb-3 flex-row justify-between">
                <Text className="font-medium text-gray-700">
                    {completedItems} of {totalItems} items ready
                </Text>
                <Text className="font-medium text-primary">
                    {Math.round(completionPercentage)}%
                </Text>
            </View>

            {/* Horizontal scrolling for order items */}
            {order.items.length > 0 ? (
                <View>
                    <FlatList
                        data={order.items}
                        keyExtractor={(item) => `${order.id}-${item.cartItemId}`}
                        renderItem={({ item }) => (
                            <KitchenOrderItem
                                item={item}
                                isChecked={checkedItems[`${order.id}-${item.cartItemId}`]}
                                onToggle={() => onToggleCheck(order.id, item.cartItemId)}
                            />
                        )}
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        className="pb-2"
                    />

                    {/* Pagination indicator dots */}
                    {order.items.length > 1 && (
                        <View className="flex-row justify-center mt-2">
                            <Text className="text-xs text-gray-500">
                                Swipe to see all {order.items.length} items
                            </Text>
                        </View>
                    )}
                </View>
            ) : (
                <Text className="text-gray-500 italic text-center py-4">No items in this order</Text>
            )}
        </View>
    );
});

const KitchenHome = () => {
    useKitchenData();
    const orders = useSharedStore((state) => state.orders);
    const menu = useSharedStore((state) => state.menu);
    const setIsLoggedIn = loginStore((state) => state.setIsLoggedIn);
    const setRole = loginStore((state) => state.setRole);
    const callWaiter = useSocketStore((state) => state.callWaiterSocket);

    const [checkedItems, setCheckedItems] = useState({});
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        if (!orders) return;
        const flatOrders = Array.isArray(orders) ? orders.flat() : [];
        setCheckedItems(getInitialCheckedItems(flatOrders));
    }, [orders]);

    const menuItemsMap = useMemo(() => createMenuItemsMap(menu), [menu]);

    const kitchenOrders = useMemo(() => {
        if (!orders) return [];

        const uniqueOrders = deduplicateOrders(orders);

        return uniqueOrders
            .filter(order => order && order.order_status !== 'Completed' && order.order_status !== 'Ready')
            .sort((a, b) => {
                // First by status urgency
                const aTime = new Date(a.order_date_time);
                const bTime = new Date(b.order_date_time);
                return aTime - bTime; // Oldest first (most urgent)
            })
            .map(order => ({
                id: order.order_id,
                tableNum: order.table_num,
                timestamp: order.order_date_time,
                items: parseOrderDetails(order.order_details)
                    .filter(detail => detail && detail.type === 'menu')
                    .map(detail => ({
                        name: menuItemsMap[detail.menu_item_id]?.menu_item_name || 'Unknown Item',
                        quantity: detail.quantity,
                        notes: detail.request || '',
                        status: detail.status || 'Pending',
                        cartItemId: detail.cartItemId || detail.cartItemID,
                        menu_item_id: detail.menu_item_id
                    }))
            }))
            .filter(order => order.items.length > 0);
    }, [orders, menuItemsMap]);

    // Filter orders based on active tab
    const filteredOrders = useMemo(() => {
        if (activeTab === "all") return kitchenOrders;

        const now = new Date();
        return kitchenOrders.filter(order => {
            const orderTime = new Date(order.timestamp);
            const diffMins = Math.floor((now - orderTime) / 60000);

            if (activeTab === "urgent") return diffMins > 20;
            if (activeTab === "attention") return diffMins > 10 && diffMins <= 20;
            if (activeTab === "new") return diffMins <= 10;

            return true;
        });
    }, [kitchenOrders, activeTab]);

    const toggleItemCheck = useCallback(async (orderId, cartItemId) => {
        const currentOrder = orders?.find(order => order.order_id === orderId);
        if (!currentOrder) return;

        // Optimistically update the UI
        const checkKey = `${orderId}-${cartItemId}`;
        const newStatus = !checkedItems[checkKey];
        setCheckedItems(prev => ({
            ...prev,
            [checkKey]: newStatus
        }));

        try {
            const orderDetails = parseOrderDetails(currentOrder.order_details || '[]');

            // Find the specific item by cartItemId
            const updatedOrderDetails = orderDetails.map(item => {
                const itemCartId = item.cartItemId || item.cartItemID;
                if (itemCartId === cartItemId) {
                    return { ...item, status: newStatus ? 'Completed' : 'Pending' };
                }
                return item;
            });

            const isOrderPending = currentOrder.order_status === 'Pending';

            const success = await updateOrder(orderId, {
                ...currentOrder,
                order_details: JSON.stringify(updatedOrderDetails),
                order_status: isOrderPending ? 'In Progress' : currentOrder.order_status,
            });

            if (!success) throw new Error('Failed to update order');

            // Update the orders in the shared store
            const currentOrders = useSharedStore.getState().orders || [];
            useSharedStore.getState().setOrders(
                currentOrders.map(o => o.order_id === orderId ? {
                    ...o,
                    order_details: JSON.stringify(updatedOrderDetails),
                } : o)
            );

        } catch (error) {
            // Revert the optimistic update if the API call fails
            setCheckedItems(prev => ({
                ...prev,
                [checkKey]: !newStatus
            }));
            console.error('Failed to update order status:', error);
            alert('Failed to update order status. Please try again.');
        }
    }, [orders, checkedItems]);

    // Calculate order statistics
    const orderStats = useMemo(() => {
        const urgent = kitchenOrders.filter(order => {
            const orderTime = new Date(order.timestamp);
            const now = new Date();
            const diffMins = Math.floor((now - orderTime) / 60000);
            return diffMins > 20;
        }).length;

        const attention = kitchenOrders.filter(order => {
            const orderTime = new Date(order.timestamp);
            const now = new Date();
            const diffMins = Math.floor((now - orderTime) / 60000);
            return diffMins > 10 && diffMins <= 20;
        }).length;

        return {
            total: kitchenOrders.length,
            urgent,
            attention,
            new: kitchenOrders.length - urgent - attention
        };
    }, [kitchenOrders]);

    // Tab button component
    const TabButton = ({ title, count, tabKey }) => (
        <TouchableOpacity
            className={`px-4 py-2 rounded-lg mr-2 flex-row items-center ${activeTab === tabKey ? 'bg-primary' : 'bg-gray-100'}`}
            onPress={() => setActiveTab(tabKey)}
        >
            <Text className={`font-medium ${activeTab === tabKey ? 'text-white' : 'text-gray-700'}`}>
                {title}
            </Text>
            {count > 0 && (
                <View className={`ml-2 px-2 py-0.5 rounded-full ${activeTab === tabKey ? 'bg-white' : 'bg-primary'}`}>
                    <Text className={`text-xs font-bold ${activeTab === tabKey ? 'text-primary' : 'text-white'}`}>
                        {count}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <Header />
            <Suspense fallback={<Text className="p-4">Loading orders...</Text>}>
                <View className="flex-1">
                    <View className="px-6 py-4 bg-white shadow-sm">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-2xl font-bold text-gray-800">Kitchen Dashboard</Text>
                            <View className="flex-row items-center space-x-3">
                                <TouchableOpacity
                                    className="bg-primary px-4 py-2 rounded-lg flex-row items-center"
                                    onPress={() => { callWaiter() }}
                                >
                                    <Ionicons name="person" size={18} color="white" />
                                    <Text className="text-white ml-1 font-medium">REQUEST WAITER</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="bg-transparent border border-red-500 px-3 py-2 rounded-lg flex-row items-center"
                                    onPress={() => {
                                        setRole('');
                                        setIsLoggedIn(false);
                                        router.push('/');
                                    }}>
                                    <Image
                                        source={icons.logout}
                                        resizeMode="contain"
                                        tintColor="#EF4444"
                                        className="w-4 h-4"
                                    />
                                    <Text className="ml-2 text-red-500 font-medium text-sm">
                                        Logout
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Order filter tabs */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            className="pb-2 -mb-1"
                        >
                            <TabButton title="All Orders" count={orderStats.total} tabKey="all" />
                            <TabButton title="Urgent" count={orderStats.urgent} tabKey="urgent" />
                            <TabButton title="Need Attention" count={orderStats.attention} tabKey="attention" />
                            <TabButton title="New" count={orderStats.new} tabKey="new" />
                        </ScrollView>
                    </View>

                    {/* Orders list */}
                    {filteredOrders.length > 0 ? (
                        <FlatList
                            data={filteredOrders}
                            keyExtractor={(item) => `order-${item.id}-${item.timestamp}`}
                            renderItem={({ item }) => (
                                <View className="px-4">
                                    <KitchenOrder
                                        order={item}
                                        checkedItems={checkedItems}
                                        onToggleCheck={toggleItemCheck}
                                    />
                                </View>
                            )}
                            contentContainerStyle={{
                                paddingVertical: 16,
                            }}
                            showsVerticalScrollIndicator={true}
                            ListEmptyComponent={null}
                        />
                    ) : (
                        <View className="flex-1 justify-center items-center p-6">
                            <Ionicons name="restaurant-outline" size={64} color="#CBD5E1" />
                            <Text className="text-xl text-gray-500 font-medium mt-4 text-center">
                                No {activeTab !== 'all' ? activeTab : ''} orders to display
                            </Text>
                            <Text className="text-gray-400 text-center mt-2">
                                When new orders come in, they will appear here
                            </Text>
                        </View>
                    )}
                </View>
            </Suspense>
        </View>
    );
};

export default React.memo(KitchenHome);
