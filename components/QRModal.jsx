import { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import QRCode from 'react-native-qrcode-svg';
import { tableStore } from "../hooks/useStore";

const API_BASE = `http://${process.env.EXPO_PUBLIC_IP}:3000`;

const QRModal = ({ visible, onClose, table_num }) => {
  const [qrValue, setQrValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { updateTableStatus } = tableStore();

  useEffect(() => {
    if (!visible || !table_num) return;

    const generateQRAndUpdateTable = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`📡 Generating QR code for table ${table_num}...`);
        const tokenResponse = await fetch(`${API_BASE}/generate-token`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ table_num }),
        });
        console.log("Has attempted to fetch")
        
        if (!tokenResponse.ok) {
          console.error('❌ Failed to generate QR code');
          throw new Error('Failed to generate QR code');
        }
        
        const { url } = await tokenResponse.json();
        console.log('✅ QR code generated successfully');
        if (!url) throw new Error('Invalid QR code data');
        
        setQrValue(url);
        console.log(`The link is for qr: ${qrValue}`)

        // Update table status using store function
        const success = await updateTableStatus(table_num, "Unavailable");
        if (!success) throw new Error('Failed to update table status');

      } catch (error) {
        console.error('❌ Operation failed:', error);
        setError('Failed to generate QR code. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    generateQRAndUpdateTable();
  }, [visible, table_num]);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-6 rounded-xl w-[80%] items-center">
          <Text className="text-lg font-semibold mb-4">
            Scan this QR code to view the menu
          </Text>

          <View className="bg-white p-4 rounded-lg">
            {isLoading ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : error ? (
              <Text className="text-red-500">{error}</Text>
            ) : (
              <QRCode value={qrValue || 'Error'} size={200} />
            )}
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