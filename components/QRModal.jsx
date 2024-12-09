import { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import QRCode from 'react-native-qrcode-svg';

const QRModal = ({ visible, onClose, table_num }) => {
  const [qrValue, setQrValue] = useState('Please wait...');

  useEffect(() => {
    const fetchToken = async () => {
      if (!table_num) {
        setQrValue('Invalid table number');
        return;
      }

      try {
        const url = `http://${process.env.EXPO_PUBLIC_IP}:3000/generate-token`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ table_num }),
        });


        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.url) {
          throw new Error('No URI in response');
        }

        setQrValue(data.url);
      } catch (error) {
        console.error('Error fetching token:', error);
        setQrValue('Error generating QR code');
      }
    };

    fetchToken();
  }, [table_num]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-6 rounded-xl w-[80%] items-center">
          <Text className="text-lg font-semibold mb-4">Scan this QR code to view the menu</Text>
          <View className="bg-white p-4 rounded-lg">
            <QRCode
              value={qrValue}
              size={200}
            />
          </View>
          <TouchableOpacity
            className="mt-4 bg-primary px-6 py-2 rounded-lg"
            onPress={onClose}
          >
            <Text className="text-white font-semibold">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default QRModal;