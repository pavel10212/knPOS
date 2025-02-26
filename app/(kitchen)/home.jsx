import React, { useState, useMemo, useCallback, Suspense, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View, Image } from "react-native";
import Checkbox from "expo-checkbox";
import Header from "../../components/Header";
import { useKitchenData } from "../../hooks/useKitchenData";
import { useSharedStore } from "../../hooks/useSharedStore";
import { loginStore } from "../../hooks/useStore";
import icons from "../../constants/icons";
import { router } from "expo-router";
import { parseOrderDetails, createMenuItemsMap, getInitialCheckedItems, deduplicateOrders } from "../../utils/kitchenUtils";
import { updateOrder } from "../../services/orderService";

const KitchenOrder = React.memo(({ order, checkedItems, onToggleCheck }) => {
    return (
        <View className="bg-white w-[300px] rounded-lg shadow-lg p-4 border border-gray-100">
            <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <View>
                    <Text className="text-xl font-bold text-primary">
                        Table {order.tableNum}
                    </Text>
                    <Text className="text-sm text-gray-500">
                        Order #{order.id}
                    </Text>
                </View>
                <View className="bg-yellow-100 px-3 py-1 rounded-full">
                    <Text className="text-yellow-700 font-medium">In Progress</Text>
                </View>
            </View>

            <ScrollView className="max-h-[300px]">
                <View className="space-y-3">
                    {order.items.map((item, index) => (
                        <View key={index} className="p-3 rounded-lg bg-white">
                            <View className="flex-row justify-between items-center">
                                <View className="flex-1">
                                    <Text className="text-base font-semibold">{item.name}</Text>
                                    <Text className="text-sm text-gray-500">
                                        Quantity: {item.quantity}
                                    </Text>
                                </View>
                                <Checkbox
                                    value={checkedItems[`${order.id}-${index}`]}
                                    onValueChange={() => onToggleCheck(index)}
                                    color={checkedItems[`${order.id}-${index}`] ? "#8390DA" : undefined}
                                />
                            </View>
                            {item.notes && (
                                <View className="mt-2 bg-gray-50 p-2 rounded">
                                    <Text className="text-sm text-gray-600">
                                        {item.notes}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
});

const KitchenHome = () => {
    useKitchenData();
    const orders = useSharedStore((state) => state.orders);
    const menu = useSharedStore((state) => state.menu);
    const setIsLoggedIn = loginStore((state) => state.setIsLoggedIn);
    const setRole = loginStore((state) => state.setRole);


    const [checkedItems, setCheckedItems] = useState({});
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
            .sort((a, b) => a.order_id - b.order_id)
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
                        status: detail.status || 'Pending'
                    }))
            }))
            .filter(order => order.items.length > 0);
    }, [orders, menuItemsMap]);

    const toggleItemCheck = useCallback(async (orderId, itemIndex) => {
        const currentOrder = orders?.find(order => order.order_id === orderId);
        if (!currentOrder) return;

        const orderDetails = parseOrderDetails(currentOrder.order_details || '[]');
        const newStatus = orderDetails[itemIndex].status === 'Completed' ? 'Pending' : 'Completed';
        orderDetails[itemIndex].status = newStatus;

        const allItemsCompleted = orderDetails
            .filter(d => d.type === 'menu')
            .every(d => d.status === 'Completed');
        const newOrderStatus = allItemsCompleted ? 'Completed' : 'In Progress';

        const success = await updateOrder(orderId, {
            ...currentOrder,
            order_details: JSON.stringify(orderDetails),
            order_status: newOrderStatus
        });

        if (success) {
            setCheckedItems(prev => ({
                ...prev,
                [`${orderId}-${itemIndex}`]: newStatus === 'Completed'
            }));
        }
    }, [orders]);

    return (
        <View className="flex-1 bg-background">
            <Header />
            <Suspense fallback={<Text>Loading...</Text>}>
                <View className="px-4 py-6 flex-1">
                    <View className="flex-row justify-between items-center mb-4 pr-2">
                        <Text className="text-2xl font-bold">ORDER LIST</Text>
                        <View className="flex-row items-center space-x-4">
                            <TouchableOpacity
                                className="bg-primary px-4 py-2 rounded-lg"
                                onPress={() => {/* Add waiter call logic here */
                                }}
                            >
                                <Text className="text-white">REQUEST WAITER</Text>
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

                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="flex-row flex-wrap justify-start gap-4 pb-4">
                            {kitchenOrders.map((order) => (
                                <KitchenOrder
                                    key={`${order.id}-${order.timestamp}`} // Use composite key
                                    order={order}
                                    checkedItems={checkedItems}
                                    onToggleCheck={(itemIndex) => toggleItemCheck(order.id, itemIndex)}
                                />
                            ))}
                        </View>
                    </ScrollView>
                </View>
            </Suspense>
        </View>
    );
};

export default React.memo(KitchenHome);
