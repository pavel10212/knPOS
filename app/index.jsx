import { router } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Index = () => {
  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-gray-100">
      <View className="p-4 bg-white rounded-lg shadow-md">
        <Text className="text-2xl font-bold text-gray-800 mb-4">Welcome to knPOS</Text>
        <TouchableOpacity 
          className="bg-blue-500 px-4 py-2 rounded"
          onPress={() => router.push("(tabs)/home")}
        >
          <Text className="text-white text-center">Go to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Index;