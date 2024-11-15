import { Stack } from "expo-router";

export default function KitchenLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="home"
                options={{ headerShown: false }}
            />
        </Stack>
    );
}