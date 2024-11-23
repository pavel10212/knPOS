import { Tabs } from "expo-router";
import { View, Image, Text } from "react-native";
import icons from "../../constants/icons";
import Header from "../../components/Header";
import { SafeAreaView } from 'react-native-safe-area-context';

const TabIcon = ({
    icon,
    color,
    name,
    focused
}) => {
    return (
        <View className="items-center justify-center gap-2 mt-6">
            <Image
                source={icon}
                resizeMode="contain"
                tintColor={color}
                className="w-8 h-8"
            />
            <Text className={`${focused ? 'font-psemibold' : 'font-pregular'}`} style={{ color: color }}>
                {name}
            </Text>
        </View>
    )
}

export default function TabsLayout() {
    return (
        <SafeAreaView className='flex-1'>
            <Header />
            <Tabs screenOptions={{
                headerShown: false,
                tabBarPosition: 'left',
                tabBarVariant: 'material',
                tabBarLabelPosition: 'below-icon',
                tabBarStyle: {
                    display: 'flex',
                    width: 115,
                    height: '100%',
                    paddingVertical: 20,
                },

                tabBarItemStyle: {
                    marginVertical: 10,
                    height: 80,
                },
                tabBarLabelStyle: {
                    fontSize: 16,
                    fontWeight: '500',
                    marginTop: 4
                }
            }}>
                <Tabs.Screen name="home" options={{
                    title: "Home",
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            icon={icons.home}
                            focused={focused}
                            color={color}
                        />
                    )
                }} />
                <Tabs.Screen name="menu" options={{
                    title: "Menu",
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            icon={icons.menu}
                            focused={focused}
                            color={color}
                        />
                    )
                }} />
                <Tabs.Screen name="order" options={{
                    title: "Order",
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            icon={icons.order}
                            focused={focused}
                            color={color}
                        />
                    )
                }} />
                <Tabs.Screen name="settings" options={{
                    title: "Settings",
                    tabBarIcon: ({ focused, color }) => (
                        <TabIcon
                            icon={icons.setting}
                            focused={focused}
                            color={color}
                        />
                    )
                }} />
            </Tabs>
        </SafeAreaView>
    );
}