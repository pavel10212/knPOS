import { Text, TouchableOpacity, View, Alert, ScrollView, useWindowDimensions } from 'react-native';

const OrderStatus = {
    IN_PROGRESS: 'In Progress',
    READY: 'Ready',
    COMPLETED: 'Completed'
};

const getStatusColor = (status) => {
    switch (status) {
        case 'Pending': return 'bg-yellow-500';
        case 'In Progress': return 'bg-blue-500';
        case 'Ready': return 'bg-green-500';
        case 'Completed': return 'bg-gray-500';
        default: return 'bg-gray-300';
    }
};

const getActionButton = (status) => {
    switch (status) {
        case OrderStatus.READY:
            return { text: 'Deliver', color: 'bg-purple-500' };
        case OrderStatus.COMPLETED:
            return { text: 'Completed', color: 'bg-gray-500' };
        default:
            return { text: 'In Progress', color: 'bg-blue-300' };
    }
};

const OrderItem = ({ item, onStatusChange }) => {
    const handleStatusPress = () => {
        if (item.type === 'inventory') {
            Alert.alert(
                'Mark Drink as Served',
                'Confirm this drink has been served:',
                [
                    { text: 'Completed', onPress: () => onStatusChange('Completed') },
                    { text: 'Cancel', style: 'cancel' },
                ]
            );
        } else if (item.type === 'menu') {
            Alert.alert(
                'Update Menu Item Status',
                'Select the new status:',
                [
                    { text: 'Ready', onPress: () => onStatusChange('Ready') },
                    { text: 'Cancel', style: 'cancel' },
                ]
            );
        }
    };

    return (
        <View className="border-b border-gray-200 py-2">
            <View className="flex-row justify-between items-center">
                <Text className="flex-1">{item.name}</Text>
                <TouchableOpacity onPress={handleStatusPress}>
                    <View className={`h-3 w-3 rounded-full ${getStatusColor(item.status)}`} />
                </TouchableOpacity>
            </View>
            <Text className="text-sm text-gray-500">x{item.quantity}</Text>
        </View>
    );
};

const TableOrders = ({ table, onItemStatusChange, onOrderDelivery }) => {
    const { height } = useWindowDimensions();
    const hasOrders = table.orders.length > 0;
    const maxHeight = hasOrders ? height * 0.9 : 100; // Smaller height for empty tables

    return (
        <View
            className={`w-[300px] p-2 ${!hasOrders ? 'opacity-50' : ''}`}
            style={{ height: maxHeight }}
        >
            <View className={`bg-white rounded-lg shadow-md p-4 flex-1 ${!hasOrders ? 'justify-center' : ''}`}>
                <Text className="font-bold text-xl mb-4">{table.name}</Text>
                {hasOrders ? (
                    <ScrollView
                        bounces={false}
                        showsVerticalScrollIndicator={true}
                        className="flex-1"
                    >
                        {table.orders.map((order) => (
                            <View key={order.id} className="mb-4">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="font-semibold">Order #{order.id}</Text>
                                    <View className={`px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                                        <Text className="text-white text-xs">{order.status}</Text>
                                    </View>
                                </View>

                                {order.items.map((item, index) => (
                                    <OrderItem
                                        key={index}
                                        item={item}
                                        onStatusChange={(newStatus) => onItemStatusChange(order.id, item, newStatus)}
                                    />
                                ))}

                                {order.status === OrderStatus.READY && (
                                    <TouchableOpacity
                                        className="mt-2 p-2 rounded-lg bg-purple-500"
                                        onPress={() => onOrderDelivery(order.id)}
                                    >
                                        <Text className="text-white text-center font-bold">Deliver</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                ) : (
                    <Text className="text-gray-500 text-center">No active orders</Text>
                )}
            </View>
        </View>
    );
};

export default TableOrders;