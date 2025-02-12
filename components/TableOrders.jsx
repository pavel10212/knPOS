import { Text, TouchableOpacity, View, Alert, ScrollView, useWindowDimensions } from 'react-native';
import ItemStatusButton from './ItemStatusButton';
import { format } from 'date-fns';

const TableOrders = ({ table, onItemStatusChange, onOrderDelivery }) => {
    return (
        <View className="w-[300px] m-2 bg-white rounded-xl shadow-md overflow-hidden">
            <View className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <Text className="text-lg font-bold text-gray-800">{table.name}</Text>
            </View>

            <ScrollView
                className="max-h-[600px]"
                showsVerticalScrollIndicator={false}
            >
                {table.orders.map((order) => (
                    <View
                        key={order.id}
                        className="p-4 border-b border-gray-100"
                    >
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="text-sm text-gray-500">
                                {format(new Date(order.order_date_time), 'HH:mm')}
                            </Text>
                            <View className={`px-2 py-1 rounded-md ${order.status === 'Ready'
                                ? 'bg-green-100'
                                : 'bg-yellow-100'
                                }`}>
                                <Text className={`text-sm font-medium ${order.status === 'Ready'
                                    ? 'text-green-700'
                                    : 'text-yellow-700'
                                    }`}>
                                    {order.status}
                                </Text>
                            </View>
                        </View>

                        {order.items.map((item, index) => (
                            <View
                                key={index}
                                className="mb-2 p-2 bg-gray-50 rounded-lg"
                            >
                                <View className="flex-row justify-between items-center mb-1">
                                    <View className="flex-1">
                                        <Text className="font-medium text-gray-800">
                                            {item.name}
                                        </Text>
                                        <Text className="text-sm text-gray-500">
                                            Qty: {item.quantity}
                                        </Text>
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
                                className="mt-3 py-2 bg-blue-500 rounded-lg items-center"
                            >
                                <Text className="text-white font-medium">
                                    Mark as Ready
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