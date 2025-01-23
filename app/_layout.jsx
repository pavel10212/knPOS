import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import "../global.css"
import RootComponent from "../components/RootComponent";

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <RootComponent>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(waiter)" options={{ headerShown: false }} />
        <Stack.Screen name="(kitchen)" options={{ headerShown: false }} />
      </Stack>
    </RootComponent>
  );
};

export default RootLayout;
