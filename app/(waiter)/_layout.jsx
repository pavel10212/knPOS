import { Tabs } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import icons from "../../constants/icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { loginStore } from "../../hooks/useStore";

const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View className="items-center justify-center gap-2 mt-6">
      <Image
        source={icon}
        resizeMode="contain"
        tintColor={color}
        className="w-8 h-8"
      />
      <Text
        className={`${focused ? "font-psemibold" : "font-pregular"}`}
        style={{ color: color }}
      >
        {name}
      </Text>
    </View>
  );
};

export default function TabsLayout() {
  const setRole = loginStore((state) => state.setRole);
  const setIsLoggedIn = loginStore((state) => state.setIsLoggedIn);
  return (
    <SafeAreaView className="flex-1">
      <View className="absolute left-0 top-0 z-10 w-[115px] h-[115px] items-center justify-center bg-white">
        <Image
          source={icons.logo}
          resizeMode="contain"
          className="w-[80px] h-[80px]"
        />
      </View>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarPosition: "left",
          tabBarVariant: "material",
          tabBarLabelPosition: "below-icon",
          tabBarStyle: {
            display: "flex",
            width: 115,
            height: "100%",
            paddingTop: 115, // Add padding for the logo
          },
          tabBarItemStyle: {
            marginVertical: 10,
            height: 80,
          },
          tabBarLabelStyle: {
            fontSize: 16,
            fontWeight: "500",
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ focused, color }) => (
              <TabIcon icon={icons.home} focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: "Menu",
            tabBarIcon: ({ focused, color }) => (
              <TabIcon icon={icons.menu} focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="order"
          options={{
            title: "Order",
            tabBarIcon: ({ focused, color }) => (
              <TabIcon icon={icons.order} focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ focused, color }) => (
              <TabIcon icon={icons.setting} focused={focused} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="payment"
          options={{
            title: "Payment",
            headerShadowVisible: false,
            href: null,
            tabBarStyle: { display: "none" },
          }}
        />
        <Tabs.Screen
          name="editOrAddOrder"
          options={{
            title: "Edit Order",
            headerShadowVisible: false,
            href: null,
            tabBarStyle: { display: "none" },
          }}
        />

      </Tabs>

      <TouchableOpacity
        className="absolute bottom-0 left-0 w-[115px] bg-red-500 py-6 items-center flex-row justify-center space-x-2"
        onPress={() => {
          setRole("");
          setIsLoggedIn(false);
          router.push("/");
        }}
      >
        <Image
          source={icons.logout}
          resizeMode="contain"
          tintColor="white"
          className="w-5 h-5"
        />
        <Text className="ml-2 text-white font-bold">Log Out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
