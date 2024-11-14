import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import "../global.css"

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default RootLayout;