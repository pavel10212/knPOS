import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useNotificationStore } from '../hooks/useNotificationStore';
import { Entypo, AntDesign, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';

const NotificationsPanel = () => {
  const {
    notifications,
    isVisible,
    hideNotificationPanel,
    markAllAsRead,
    markAsRead,
    removeNotification,
  } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  const { width } = useWindowDimensions();
  const [isPinned, setIsPinned] = useState(false);
  const panelRef = useRef(null);
  
  // Animation values
  const [translateY] = useState(new Animated.Value(-20));
  const [opacityValue] = useState(new Animated.Value(0));
  
  // Auto-hide timer
  const autoHideTimeoutRef = useRef(null);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      
      if (!isPinned) {
        resetAutoHideTimer();
      }
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    }
    
    return () => {
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };
  }, [isVisible, isPinned]);

  const resetAutoHideTimer = () => {
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
    }
    
    if (!isPinned) {
      autoHideTimeoutRef.current = setTimeout(() => {
        hideNotificationPanel();
      }, 5000);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'success': 
        return <AntDesign name="checkcircle" size={18} color="#22c55e" />;
      case 'error': 
        return <AntDesign name="closecircle" size={18} color="#ef4444" />;
      case 'info': 
        return <AntDesign name="infocirlce" size={18} color="#8390DA" />;
      case 'warning':
        return <AntDesign name="warning" size={18} color="#f59e0b" />;
      default:
        return <AntDesign name="bells" size={18} color="#6b7280" />;
    }
  };

  const getNotificationStyle = (type) => {
    switch(type) {
      case 'success': 
        return 'border-l-4 border-l-green-500';
      case 'error': 
        return 'border-l-4 border-l-red-500';
      case 'info': 
        return 'border-l-4 border-l-primary';
      case 'warning':
        return 'border-l-4 border-l-amber-500';
      default:
        return 'border-l-4 border-l-gray-500';
    }
  };

  const togglePinPanel = () => {
    setIsPinned(!isPinned);
    if (isPinned) {
      resetAutoHideTimer();
    } else if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
    }
  };

  if (!isVisible) {
    return null;
  }
  
  return (
    <Animated.View
      ref={panelRef}
      className="absolute z-50"
      style={[
        {
          transform: [{ translateY }],
          opacity: opacityValue,
          width: Math.min(width * 0.35, 350),
          right: 307,
          top: 50,
          maxHeight: '80%', // Ensure panel doesn't exceed screen height
        },
      ]}
      pointerEvents="box-none"
    >
      <View className="w-0 h-0 self-end mr-5 border-8 border-transparent border-b-white" pointerEvents="none" />
      
      <View className="bg-white rounded-lg shadow-lg flex flex-col max-h-full" pointerEvents="auto">
        <View className="flex-row justify-between items-center px-3 py-2 border-b border-gray-200">
          <View className="flex-row items-center">
            <MaterialIcons name="notifications" size={22} color="#8390DA" />
            <Text className="font-bold text-base text-gray-800 ml-2">Notifications</Text>
            {unreadCount > 0 && (
              <View className="bg-red-500 rounded-full min-w-[18px] h-[18px] justify-center items-center ml-2 px-1">
                <Text className="text-white text-xs font-bold">{unreadCount}</Text>
              </View>
            )}
          </View>
          <View className="flex-row">
            {notifications.length > 0 && (
              <TouchableOpacity 
                className="p-1 mr-1"
                onPress={markAllAsRead}
              >
                <MaterialIcons name="done-all" size={18} color="#8390DA" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              className="p-1 mr-1"
              onPress={togglePinPanel}
            >
              <MaterialIcons 
                name={isPinned ? "push-pin" : "push-pin-outlined"} 
                size={18} 
                color={isPinned ? "#8390DA" : "#6b7280"}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              className="p-1"
              onPress={hideNotificationPanel}
            >
              <AntDesign name="close" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={true}
          onScrollBeginDrag={resetAutoHideTimer}
          contentContainerStyle={{ flexGrow: 0 }}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
        >
          {notifications.length === 0 ? (
            <View className="p-4 items-center">
              <Text className="text-gray-500 text-sm">No notifications</Text>
            </View>
          ) : (
            <View>
              {notifications.map((notification) => (
                <View 
                  key={notification.id} 
                  className={`flex-row p-3 bg-white ${getNotificationStyle(notification.type)} ${notification.read ? 'opacity-70' : ''}`}
                >
                  <View className="justify-center mr-2">
                    {getNotificationIcon(notification.type)}
                  </View>
                  <View className="flex-1 justify-center">
                    <Text className={`text-sm font-medium text-gray-800 mb-0.5 ${notification.read ? 'opacity-70' : ''}`}>
                      {notification.text1}
                    </Text>
                    {notification.text2 && (
                      <Text className={`text-xs text-gray-600 mb-1 ${notification.read ? 'opacity-70' : ''}`}>
                        {notification.text2}
                      </Text>
                    )}
                    <Text className="text-xs text-gray-400">
                      {formatTime(notification.timestamp)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    {!notification.read && (
                      <TouchableOpacity 
                        className="p-1"
                        onPress={() => markAsRead(notification.id)}
                      >
                        <Ionicons name="checkmark-circle-outline" size={20} color="#8390DA" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      className="p-1"
                      onPress={() => removeNotification(notification.id)}
                    >
                      <AntDesign name="close" size={18} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Animated.View>
  );
};

export default NotificationsPanel;