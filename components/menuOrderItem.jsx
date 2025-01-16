import {Text, TouchableOpacity, View} from 'react-native';

const MenuOrderItem = ({ order, onIncrease, onDecrease }) => {
    return (
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <View className="flex-1">
                <Text className="font-bold text-lg">{order.name}</Text>
                <Text className="text-gray-500">Price: ${order.price.toFixed(2)}</Text>
            </View>
            <View className="flex-row items-center">
                <TouchableOpacity
                    className="p-2 bg-red-500 rounded-full"
                    onPress={() => onDecrease(order.id)}
                >
                    <Text className="text-white text-lg">-</Text>
                </TouchableOpacity>
                <Text className="mx-4 font-bold text-lg">{order.quantity}</Text>
                <TouchableOpacity
                    className="p-2 bg-green-500 rounded-full"
                    onPress={() => onIncrease(order.id)}
                >
                    <Text className="text-white text-lg">+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default MenuOrderItem;
