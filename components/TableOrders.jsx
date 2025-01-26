import {ScrollView, Text, TouchableOpacity, View} from 'react-native'

const OrderStatus = {
    PENDING: 'Pending',
    READY: 'Ready',
    DELIVERED: 'Completed'
}

const getStatusColor = (status) => {
    switch (status) {
        case OrderStatus.PENDING: return 'bg-yellow-500';
        case OrderStatus.READY: return 'bg-green-500';
        case OrderStatus.DELIVERED: return 'bg-gray-500';
    }
}

const getActionButton = (status) => {
    switch (status) {
        case OrderStatus.PENDING:
            return { text: 'Send to Kitchen', color: 'bg-blue-500' };
        case OrderStatus.PREPARING:
            return { text: 'Mark as Ready', color: 'bg-green-500' };
        case OrderStatus.READY:
            return { text: 'Deliver', color: 'bg-purple-500' };
        default:
            return { text: 'Completed', color: 'bg-gray-500' };
    }
}

const OrderItem = ({ item }) => (
    <View className="border-b border-gray-200 py-2">
        <View className="flex-row justify-between items-center">
            <Text className="flex-1">{item.name}</Text>
            <View className={`h-3 w-3 rounded-full ${getStatusColor(item.status)}`} />
        </View>
        <Text className="text-sm text-gray-500">x{item.quantity}</Text>
        {item.notes && (
            <Text className="text-xs text-gray-400">Note: {item.notes}</Text>
        )}
    </View>
)

const TableCard = ({ table }) => {
    return (
        <View className="w-1/4 p-2">
            <View className="bg-white rounded-lg shadow-md p-4">
                <Text className="font-bold text-xl mb-4">{table.name}</Text>

                <ScrollView className="max-h-80">
                    {table.orders.map((order) => (
                        <View key={order.id} className="mb-4">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="font-semibold">Order #{order.id}</Text>
                                <View className={`px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                                    <Text className="text-white text-xs">{order.status}</Text>
                                </View>
                            </View>

                            {order.items.map((item, index) => (
                                <OrderItem key={index} item={item} />
                            ))}

                            <TouchableOpacity
                                className={`mt-2 p-2 rounded-lg ${getActionButton(order.status).color}`}
                            >
                                <Text className="text-white text-center font-bold">
                                    {getActionButton(order.status).text}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    )
}

const TableOrders = ({ table }) => {
    return <TableCard table={table} />
}

export default TableOrders