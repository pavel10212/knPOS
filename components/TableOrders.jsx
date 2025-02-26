import { Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ItemStatusButton from './ItemStatusButton';
import { format } from 'date-fns';

const TableOrders = ({ table, onItemStatusChange, onOrderDelivery }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Ready': return 'bg-green-100';
            case 'In Progress': return 'bg-yellow-100';
            default: return 'bg-gray-100';
        }
    };

    const getStatusTextColor = (status) => {
        switch (status) {
            case 'Ready': return 'text-green-700';
            case 'In Progress': return 'text-yellow-700';
            default: return 'text-gray-700';
        }
    };

    return (
        <View className="w-[320px] m-3 bg-white rounded-xl shadow-lg overflow-hidden">
            <View className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                <View className="flex-row justify-between items-center">
                    <Text className="text-xl font-bold text-gray-800">{table.name}</Text>
                    <View className="bg-blue-50 px-3 py-1 rounded-full">
                        <Text className="text-blue-600 font-medium">
                            {table.orders.length} {table.orders.length === 1 ? 'Order' : 'Orders'}
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="max-h-[650px]"
                showsVerticalScrollIndicator={false}
            >
                {table.orders.map((order) => (
                    <View
                        key={order.id}
                        className="p-5 border-b border-gray-100"
                    >
                        <View className="flex-row justify-between items-center mb-4">
                            <View className="flex-row items-center">
                                <MaterialIcons name="access-time" size={18} color="#6B7280" />
                                <Text className="text-sm text-gray-500 ml-1">
                                    {format(new Date(order.order_date_time), 'HH:mm')}
                                </Text>
                            </View>
                            <View className={`px-3 py-1.5 rounded-full ${getStatusColor(order.status)}`}>
                                <Text className={`text-sm font-medium ${getStatusTextColor(order.status)}`}>
                                    {order.status}
                                </Text>
                            </View>
                        </View>

                        {order.items.map((item, index) => (
                            <View
                                key={index}
                                className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                            >
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-1">
                                        <Text className="font-medium text-gray-800">
                                            {item.name}
                                        </Text>
                                        <View className="flex-row items-center mt-1">
                                            <MaterialIcons name="category" size={14} color="#6B7280" />
                                            <Text className="text-sm text-gray-500 ml-1">
                                                {item.type === 'inventory' ? 'Drink' : 'Food'} · Qty: {item.quantity}
                                            </Text>
                                        </View>
                                    </View>
                                    <ItemStatusButton
                                        status={item.status}
                                        itemType={item.type}
                                        onPress={() => {
                                            const nextStatus = item.type === 'inventory'
                                                ? 'Completed'
                                                : item.status === 'Pending'
                                                    ? 'In Progress'
                                                    : item.status === 'In Progress'
                                                        ? 'Ready'
                                                        : 'Completed';
                                            onItemStatusChange(order.id, item, nextStatus);
                                        }}
                                    />
                                </View>
                            </View>
                        ))}

                        {order.status !== 'Ready' && (
                            <TouchableOpacity
                                onPress={() => onOrderDelivery(order.id)}
                                className="mt-4 py-3 bg-blue-500 rounded-lg items-center flex-row justify-center"
                                activeOpacity={0.7}
                            >
                                <MaterialIcons name="check-circle" size={20} color="white" />
                                <Text className="text-white font-medium ml-2">
                                    Mark Order as Ready
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

export default TableOrders;