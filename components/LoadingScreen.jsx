import { View, Text, ActivityIndicator, Image } from 'react-native';
import React from 'react';
import icons from '../constants/icons';

/**
 * A loading screen component that shows loading progress with optional status messages
 */
const LoadingScreen = ({ message = "Loading", progress = 0, statusMessages = [] }) => {
  return (
    <View className="absolute inset-0 bg-white flex items-center justify-center z-50">
      <View className="items-center">
        <Image 
          source={icons.logo} 
          className="w-32 h-32 mb-8" 
          resizeMode="contain"
        />
        
        <ActivityIndicator size="large" color="#3b82f6" />
        
        <Text className="mt-4 text-lg font-semibold text-gray-800">{message}</Text>
        
        {progress > 0 && progress < 1 && (
          <View className="w-[200px] h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
            <View 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }} 
            />
          </View>
        )}
        
        {statusMessages.length > 0 && (
          <View className="mt-4 max-h-[100px] overflow-hidden">
            {statusMessages.slice(-3).map((msg, index) => (
              <Text 
                key={index} 
                className="text-xs text-gray-500 text-center"
                numberOfLines={1}
              >
                {msg}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default LoadingScreen;