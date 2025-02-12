import { Modal, View, Text, TouchableOpacity } from 'react-native';

const ConfirmationModal = ({ visible, onConfirm, onCancel, title, message }) => {
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white rounded-xl p-6 m-4 w-80 shadow-xl">
                    <Text className="text-xl font-bold mb-3 text-gray-800">
                        {title}
                    </Text>
                    <Text className="text-gray-600 mb-6">
                        {message}
                    </Text>
                    <View className="flex-row justify-end space-x-3">
                        <TouchableOpacity
                            onPress={onCancel}
                            className="px-4 py-2 rounded-lg bg-gray-200"
                        >
                            <Text className="text-gray-800 font-medium">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onConfirm}
                            className="px-4 py-2 rounded-lg bg-blue-500"
                        >
                            <Text className="text-white font-medium">Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ConfirmationModal;
