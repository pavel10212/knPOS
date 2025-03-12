import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotificationStore } from '../hooks/useNotificationStore';

const NotificationIndicator = () => {
  const { notifications, toggleNotificationPanel, isVisible } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Animation for the indicator when new notifications arrive
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const hasAnimated = useRef(false);
  
  useEffect(() => {
    if (unreadCount > 0 && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        hasAnimated.current = false;
      });
    }
  }, [unreadCount]);

  return (
    <TouchableOpacity
      style={{
        padding: 4,
        marginRight: 4,
      }}
      onPress={toggleNotificationPanel}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <MaterialIcons 
        name="notifications-none" 
        size={20} 
        color={isVisible ? "#3b82f6" : "#666"} 
      />
      {unreadCount > 0 && (
        <Animated.View 
          style={{
            position: 'absolute',
            top: 1,
            right: 1,
            backgroundColor: unreadCount > 5 ? '#ef4444' : '#f59e0b',
            borderRadius: 6,
            minWidth: 14,
            height: 14,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 2,
            borderWidth: 1,
            borderColor: '#ffffff',
            transform: [{ scale: pulseAnim }],
          }}
        >
          <Text style={{
            color: '#fff',
            fontSize: 8,
            fontWeight: 'bold',
          }}>{unreadCount}</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

export default NotificationIndicator;