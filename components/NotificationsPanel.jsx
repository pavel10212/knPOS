import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useNotificationStore } from '../hooks/useNotificationStore';
import { useSocketStore } from '../hooks/useSocket';
import { Entypo, AntDesign, MaterialIcons, Ionicons, FontAwesome } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';

// Helper function to calculate time elapsed in minutes
const getElapsedMinutes = (timestamp) => {
  const now = new Date();
  const notificationTime = new Date(timestamp);
  return Math.floor((now - notificationTime) / 1000 / 60);
};

const NotificationsPanel = () => {
  const {
    notifications,
    isVisible,
    hideNotificationPanel,
    markAllAsRead,
    markAsRead,
    removeNotification,
    clearNotifications,
    resolveTableRequest,
  } = useNotificationStore();
  
  const { clearPendingRequest } = useSocketStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.isPersistent && !n.read).length;
  const { width } = useWindowDimensions();
  const [isPinned, setIsPinned] = useState(false);
  const panelRef = useRef(null);
  
  // Force auto-pin when there are urgent notifications
  useEffect(() => {
    if (urgentCount > 0 && !isPinned) {
      setIsPinned(true);
    }
  }, [urgentCount]);
  
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
      
      if (!isPinned && urgentCount === 0) {
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
  }, [isVisible, isPinned, urgentCount]);

  const resetAutoHideTimer = () => {
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
    }
    
    if (!isPinned && urgentCount === 0) {
      autoHideTimeoutRef.current = setTimeout(() => {
        hideNotificationPanel();
      }, 5000);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNotificationIcon = (notification) => {
    const { type, notificationType } = notification;
    
    // Special icons for specific notification types
    if (notificationType === 'bill-request') {
      return <FontAwesome name="money" size={18} color="#ef4444" />;
    } else if (notificationType === 'table-call') {
      return <MaterialIcons name="priority-high" size={18} color="#f59e0b" />;
    }
    
    // Default icons based on notification type
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

  const getNotificationStyle = (notification) => {
    const { type, isPersistent, notificationType } = notification;
    const elapsed = getElapsedMinutes(notification.timestamp);
    
    // Special styles for urgent notifications
    if (isPersistent && !notification.read) {
      if (notificationType === 'bill-request') {
        return elapsed > 5 
          ? 'border-l-4 border-l-red-500 bg-red-50' 
          : 'border-l-4 border-l-red-500';
      } else if (notificationType === 'table-call') {
        return elapsed > 5 
          ? 'border-l-4 border-l-amber-500 bg-amber-50' 
          : 'border-l-4 border-l-amber-500';
      }
    }
    
    // Default styles based on notification type
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
    // Don't allow unpinning if there are urgent notifications
    if (isPinned && urgentCount > 0) {
      return;
    }
    
    setIsPinned(!isPinned);
    if (isPinned) {
      resetAutoHideTimer();
    } else if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
    }
  };
  
  const handleResolveRequest = (notification) => {
    if (notification.tableNum) {
      // Handle both the notification store and socket store
      resolveTableRequest(notification.tableNum);
      clearPendingRequest(notification.tableNum);
      
      // Mark notification as read
      markAsRead(notification.id);
    }
  };

  // Sort notifications with urgent ones first
  const sortedNotifications = [...notifications].sort((a, b) => {
    // First priority: Urgent unread notifications (bill requests first, then table calls)
    if (a.isPersistent && !a.read && b.isPersistent && !b.read) {
      if (a.notificationType === 'bill-request' && b.notificationType !== 'bill-request') return -1;
      if (b.notificationType === 'bill-request' && a.notificationType !== 'bill-request') return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    }
    if (a.isPersistent && !a.read) return -1;
    if (b.isPersistent && !a.read) return 1;
    
    // Second priority: Other unread notifications
    if (!a.read && b.read) return -1;
    if (a.read && !b.read) return 1;
    
    // Last priority: Sort by timestamp (newest first)
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

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
            <MaterialIcons name="notifications" size={22} color={urgentCount > 0 ? "#ef4444" : "#8390DA"} />
            <Text className="font-bold text-base text-gray-800 ml-2">Notifications</Text>
            {urgentCount > 0 && (
              <View className="bg-red-500 rounded-full min-w-[18px] h-[18px] justify-center items-center ml-2 px-1">
                <Text className="text-white text-xs font-bold">{urgentCount}</Text>
              </View>
            )}
            {urgentCount === 0 && unreadCount > 0 && (
              <View className="bg-amber-500 rounded-full min-w-[18px] h-[18px] justify-center items-center ml-2 px-1">
                <Text className="text-white text-xs font-bold">{unreadCount}</Text>
              </View>
            )}
          </View>
          <View className="flex-row">
            {notifications.length > 0 && (
              <>
                <TouchableOpacity 
                  className="p-1 mr-1"
                  onPress={markAllAsRead}
                >
                  <MaterialIcons name="done-all" size={18} color="#8390DA" />
                </TouchableOpacity>
                <TouchableOpacity 
                  className="p-1 mr-1"
                  onPress={clearNotifications}
                >
                  <MaterialIcons name="clear-all" size={18} color="#8390DA" />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity 
              className="p-1 mr-1"
              onPress={togglePinPanel}
              disabled={urgentCount > 0}
            >
              <MaterialIcons 
                name={isPinned ? "push-pin" : "push-pin"} 
                size={18} 
                style={{ transform: [{ rotate: isPinned ? '0deg' : '45deg' }] }}
                color={urgentCount > 0 ? "#ef4444" : (isPinned ? "#8390DA" : "#6b7280")}
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

        {urgentCount > 0 && (
          <View className="bg-red-50 p-2 flex-row items-center justify-between">
            <Text className="text-red-600 text-xs font-medium">
              {urgentCount === 1 ? 'There is 1 urgent request requiring attention!' : 
                `There are ${urgentCount} urgent requests requiring attention!`}
            </Text>
            <MaterialIcons name="priority-high" size={16} color="#ef4444" />
          </View>
        )}

        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={true}
          onScrollBeginDrag={resetAutoHideTimer}
          contentContainerStyle={{ flexGrow: 0 }}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
        >
          {sortedNotifications.length === 0 ? (
            <View className="p-4 items-center">
              <Text className="text-gray-500 text-sm">No notifications</Text>
            </View>
          ) : (
            <View>
              {sortedNotifications.map((notification) => {
                const elapsedMin = getElapsedMinutes(notification.timestamp);
                const displayElapsedTime = elapsedMin < 1 
                  ? 'Just now' 
                  : `${elapsedMin} min ago`;
                
                const isPersistentUnread = notification.isPersistent && !notification.read;
                
                return (
                  <View 
                    key={notification.id} 
                    className={`flex-row p-3 ${getNotificationStyle(notification)} ${notification.read ? 'opacity-80' : ''}`}
                  >
                    <View className="justify-center mr-2">
                      {getNotificationIcon(notification)}
                    </View>
                    <View className="flex-1 justify-center">
                      <Text className={`text-sm font-medium ${isPersistentUnread ? 'text-red-800 font-bold' : 'text-gray-800'} mb-0.5 ${notification.read ? 'opacity-80' : ''}`}>
                        {notification.text1}
                      </Text>
                      {notification.text2 && (
                        <Text className={`text-xs ${isPersistentUnread ? 'text-red-700' : 'text-gray-600'} mb-1 ${notification.read ? 'opacity-80' : ''}`}>
                          {notification.text2}
                        </Text>
                      )}
                      <View className="flex-row items-center">
                        <Text className={`text-xs ${isPersistentUnread && elapsedMin > 3 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                          {displayElapsedTime}
                        </Text>
                        
                        {isPersistentUnread && elapsedMin > 0 && (
                          <Text className="text-xs text-red-500 font-bold ml-2">
                            {notification.notificationType === 'bill-request' ? '⏱️ WAITING FOR BILL' : '⏱️ NEEDS ASSISTANCE'}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      {isPersistentUnread && (
                        <TouchableOpacity 
                          className="px-2 py-1.5 mr-1 bg-green-100 rounded-md"
                          onPress={() => handleResolveRequest(notification)}
                          activeOpacity={0.6}
                          style={{ minWidth: 60, alignItems: 'center' }}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Text className="text-xs text-green-700 font-medium">Resolve</Text>
                        </TouchableOpacity>
                      )}
                      {!notification.read && !isPersistentUnread && (
                        <TouchableOpacity 
                          className="p-2"
                          onPress={() => markAsRead(notification.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="checkmark-circle-outline" size={20} color="#8390DA" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        className="p-2"
                        onPress={() => removeNotification(notification.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <AntDesign name="close" size={18} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </Animated.View>
  );
};

export default NotificationsPanel;