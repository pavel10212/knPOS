import { Stack } from "expo-router";

export default function AdminLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="home"
                options={{
                    title: "Admin Dashboard",
                    headerShown: false,
                    headerStyle: {
                        backgroundColor: '#f4511e',
                    },
                    headerTintColor: '#fff'
                }}
            />
        </Stack>
    );
}