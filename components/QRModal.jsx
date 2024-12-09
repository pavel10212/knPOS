import { Modal, Text, TouchableOpacity, View } from "react-native";

const QRModal = ({ visible, onClose }) => {

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-6 rounded-xl w-[80%]">
          {/* Empty content - to be filled later */}
          <View className="mb-4">
            {/* Your QR code content will go here */}
          </View>
          
          <TouchableOpacity 
            onPress={onClose}
            className="bg-gray-200 py-2 rounded-lg"
          >
            <Text className="text-center font-semibold">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default QRModal;