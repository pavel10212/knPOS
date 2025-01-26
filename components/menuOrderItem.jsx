import { Text, TouchableOpacity, View, TextInput, Modal } from 'react-native';
import { useState } from 'react';

const MenuOrderItem = ({ order, onIncrease, onDecrease }) => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [noteText, setNoteText] = useState(order.request);

    const handleSave = () => {
        if (order.request !== noteText) {
            order.request = noteText;
            onIncrease(order.id, 0, noteText); // Using onIncrease as a handler to pass notes
        }
        setIsModalVisible(false);
    };

    const handleCancel = () => {
        setNoteText(order.request);
        setIsModalVisible(false);
    };

    return (
        <>
            <View className="p-4 border-b border-gray-100 bg-white shadow-sm">
                {/* Header row with name and price */}
                <View className="flex-row justify-between items-start mb-2">
                    <Text className="font-bold text-lg text-gray-800 flex-1 mr-4">{order.name}</Text>
                    <Text className="text-gray-600 font-medium">${order.price.toFixed(2)}</Text>
                </View>

                {/* Notes row */}
                <View className="flex-row items-center mb-3">
                    <View className="flex-1 bg-gray-50 rounded-lg p-2 mr-2">
                        <Text
                            className="text-sm text-gray-600"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {order.request || 'No notes'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        className="px-3 py-2 bg-blue-50 rounded-lg"
                        onPress={() => setIsModalVisible(true)}
                    >
                        <Text className="text-blue-600 font-medium">Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* Quantity controls */}
                <View className="flex-row items-center justify-end">
                    <TouchableOpacity
                        className="w-8 h-8 bg-red-50 rounded-lg items-center justify-center"
                        onPress={() => onDecrease(order.id)}
                    >
                        <Text className="text-red-600 text-lg font-semibold">-</Text>
                    </TouchableOpacity>
                    <Text className="mx-4 font-bold text-lg text-gray-800 w-8 text-center">
                        {order.quantity}
                    </Text>
                    <TouchableOpacity
                        className="w-8 h-8 bg-green-50 rounded-lg items-center justify-center"
                        onPress={() => onIncrease(order.id)}
                    >
                        <Text className="text-green-600 text-lg font-semibold">+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={handleCancel}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white p-8 rounded-2xl w-[70%] shadow-lg">
                        <Text className="text-xl font-bold mb-6 text-gray-800">Edit Notes</Text>
                        <TextInput
                            className="border border-gray-200 rounded-xl p-4 mb-6 w-full min-h-[120px] text-base bg-gray-50"
                            value={noteText}
                            onChangeText={setNoteText}
                            placeholder="Add special requests, allergies, or preferences..."
                            placeholderTextColor="#9CA3AF"
                            multiline
                            textAlignVertical="top"
                        />
                        <View className="flex-row justify-end space-x-3">
                            <TouchableOpacity
                                className="px-6 py-3 bg-gray-100 rounded-xl"
                                onPress={handleCancel}
                            >
                                <Text className="text-gray-600 font-medium">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="px-6 py-3 bg-blue-500 rounded-xl"
                                onPress={handleSave}
                            >
                                <Text className="text-white font-medium">Save Notes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
};

export default MenuOrderItem;
