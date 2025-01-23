import { Image, Text, View } from "react-native";
import React from "react";
import icons from "../constants/icons";

const Header = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <View className="border-hairline w-full h-[100px] px-4 items-center flex-row justify-between bg-white">
      <View className="flex-row items-center">
        <Image
          source={icons.logo}
          resizeMode="contain"
          className="w-[90px] h-[90px]"
        />
      </View>
      <View className="flex flex-row items-center">
        <Image
          source={icons.calendar}
          className="w-6 h-6 mr-2"
          resizeMode="contain"
        />
        <Text className="text-gray-600 text-base">{currentDate}</Text>
      </View>
    </View>
  );
};

export default Header;
