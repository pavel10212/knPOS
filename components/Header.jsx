import { View } from "react-native";
import React from "react";
import NotificationIndicator from "./NotificationIndicator";

const Header = () => {
  return (
    <View className="w-full h-[30px] px-4 items-center flex-row justify-end">
      <NotificationIndicator />
    </View>
  );
};

export default Header;
