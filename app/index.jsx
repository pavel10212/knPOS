import { router } from 'expo-router';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useStore from '../hooks/useStore';
import { useState } from 'react';


const PinDial = ({ number, onPress }) => {
  return (
    <TouchableOpacity
      className="bg-gray-100/90 w-16 h-16 rounded-2xl items-center justify-center m-2 shadow-sm active:bg-gray-200"
      onPress={onPress}
    >
      <Text className="text-gray-800 text-2xl font-medium">
        {number}
      </Text>
    </TouchableOpacity>
  )
}

function Index() {
  const { setRole } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [pin, setPin] = useState("");

  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
      <View className="p-4 bg-white rounded-lg shadow-md">
        <Text className="text-2xl font-bold text-gray-800 mb-4">Welcome to knPOS</Text>
        <View className="flex flex-col gap-4">
          <Text className="text-lg font-semibold text-center">
            Select Role
          </Text>
          <TouchableOpacity
            className="bg-blue-500 p-4 rounded-lg"
            onPress={() => setModalVisible(true)}
          >
            <Text className="text-white">
              Admin
            </Text>
          </TouchableOpacity>
          <Modal
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
            transparent={true}
            animationType="fade"
          >
            <View className="flex-1 justify-center items-center bg-black/60 backdrop-blur-sm">
              <View className="bg-white/95 p-8 rounded-3xl w-[340px] shadow-2xl">
                <View className="flex-row justify-between items-center mb-8">
                  <Text className="text-2xl font-bold text-gray-800">
                    Enter PIN
                  </Text>
                  <TouchableOpacity
                    className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                    onPress={() => setModalVisible(false)}
                  >
                    <Text className="text-gray-600 text-lg">✕</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row justify-center space-x-3 mb-8">
                  {[...Array(6)].map((_, i) => (
                    <View
                      key={i}
                      className={`w-3 h-3 rounded-full ${i < pin.length ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                    />
                  ))}
                </View>

                <View className="items-center mb-6">
                  <View className="flex-row flex-wrap justify-center">
                    {[1, 2, 3].map((num) => (
                      <PinDial
                        key={num}
                        number={num}
                        onPress={() => pin.length < 6 && setPin(prev => prev + num)}
                      />
                    ))}
                  </View>
                  <View className="flex-row flex-wrap justify-center">
                    {[4, 5, 6].map((num) => (
                      <PinDial
                        key={num}
                        number={num}
                        onPress={() => pin.length < 6 && setPin(prev => prev + num)}
                      />
                    ))}
                  </View>
                  <View className="flex-row flex-wrap justify-center">
                    {[7, 8, 9].map((num) => (
                      <PinDial
                        key={num}
                        number={num}
                        onPress={() => pin.length < 6 && setPin(prev => prev + num)}
                      />
                    ))}
                  </View>
                  <View className="flex-row flex-wrap justify-center">
                    <PinDial
                      number={0}
                      onPress={() => pin.length < 6 && setPin(prev => prev + "0")}
                    />
                    <TouchableOpacity
                      className="bg-red-100 w-16 h-16 rounded-2xl items-center justify-center m-2 active:bg-red-200"
                      onPress={() => setPin(prev => prev.slice(0, -1))}
                    >
                      <Text className="text-red-500 text-2xl">←</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  className="bg-blue-500 p-4 rounded-2xl w-full shadow-lg shadow-blue-500/50 active:bg-blue-600"
                  onPress={() => {
                    if (pin === "123456") {
                      setRole("admin");
                      setPin("");
                      router.replace("/(admin)/home");
                      setModalVisible(false);
                    }
                  }}
                >
                  <Text className="text-white text-center text-lg font-semibold">
                    Unlock
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <TouchableOpacity
            className="bg-blue-500 p-4 rounded-lg"
            onPress={() => {
              setRole("waiter")
              router.push("/(tabs)/home")
            }}
          >
            <Text className="text-white">
              Waiter
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-blue-500 p-4 rounded-lg"
            onPress={() => {
              setRole("kitchen")
              router.push("/(kitchen)/home")
            }}
          >
            <Text className="text-white">
              Kitchen
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default Index;