import { Modal, Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ConfirmationModal = ({ visible, onConfirm, onCancel, title, message }) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="w-[340px] bg-white rounded-2xl p-6 shadow-xl">
                    <View className="items-center mb-4">
                        <View className="bg-blue-50 rounded-full p-3 mb-3">
                            <MaterialIcons name="help-outline" size={28} color="#2563EB" />
                        </View>
                        <Text className="text-xl font-bold text-gray-800 mb-2">
                            {title}
                        </Text>
                        <Text className="text-gray-600 text-center">
                            {message}
                        </Text>
                    </View>
                    
                    <View className="flex-row justify-center space-x-3 mt-2">
                        <TouchableOpacity
                            onPress={onCancel}
                            className="flex-1 py-3 px-4 rounded-lg bg-gray-100"
                            activeOpacity={0.7}
                        >
                            <Text className="text-gray-700 font-medium text-center">
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={onConfirm}
                            className="flex-1 py-3 px-4 rounded-lg bg-blue-500 flex-row justify-center items-center"
                            activeOpacity={0.7}
                        >
                            <MaterialIcons name="check-circle" size={20} color="white" />
                            <Text className="text-white font-medium text-center ml-2">
                                Confirm
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ConfirmationModal;
