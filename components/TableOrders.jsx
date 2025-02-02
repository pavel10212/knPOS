import { Text, TouchableOpacity, View, Alert } from 'react-native';

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
        if (item.type !== 'inventory') return;

        Alert.alert(
            'Mark Drink as Served',
            'Confirm this drink has been served:',
            [
                { text: 'Completed', onPress: () => onStatusChange('Completed') },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    return (
        <View className="border-b border-gray-200 py-2">
            <View className="flex-row justify-between items-center">
                <Text className="flex-1">{item.name}</Text>
                <TouchableOpacity onPress={item.type === 'inventory' ? handleStatusPress : null}>
                    <View className={`h-3 w-3 rounded-full ${getStatusColor(item.status)}`} />
                </TouchableOpacity>
            </View>
            <Text className="text-sm text-gray-500">x{item.quantity}</Text>
        </View>
    );
};

const TableOrders = ({ table, onItemStatusChange, onOrderDelivery }) => {
    return (
        <View className="w-1/4 p-2">
            <View className="bg-white rounded-lg shadow-md p-4">
                <Text className="font-bold text-xl mb-4">{table.name}</Text>
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
            </View>
        </View>
    );
};

export default TableOrders;