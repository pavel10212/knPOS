import { router } from 'expo-router';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginStore } from '../hooks/useStore';
import logo from '../assets/icons/logo.png';

function Index() {
  const setRole = loginStore((state) => state.setRole)
  const role = loginStore((state) => state.role)
  const isLoggedIn = loginStore((state) => state.isLoggedIn)
  const setIsLoggedIn = loginStore((state) => state.setIsLoggedIn)


  if (isLoggedIn) {
    router.replace(`/(${role})/home`);
  }

  return (
    <SafeAreaView className="flex-1 justify-center items-center bg-white">
      <Image
        source={logo}
        className='w-[181px] h-[212px]'
        resizeMode='contain'
      />
      <View className="flex flex-col gap-4">
        <TouchableOpacity
          className="bg-primary w-[170px] h-[60px] rounded-lg justify-center"
          onPress={() => {
            setRole("waiter")
            setIsLoggedIn(true)
            router.replace("/(waiter)/home")
          }}
        >
          <Text className="text-white text-center text-lg">
            Front of house
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-primary w-[170px] h-[60px] rounded-lg justify-center"
          onPress={() => {
            setRole("kitchen")
            setIsLoggedIn(true)
            router.replace("/(kitchen)/home")
          }}
        >
          <Text className="text-white text-center text-lg">
            Kitchen
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default Index;
