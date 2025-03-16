import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, Animated, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNotificationStore } from '../hooks/useNotificationStore';

const NotificationIndicator = () => {
  const { notifications, toggleNotificationPanel, isVisible } = useNotificationStore();
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Check for urgent notifications (bill requests and table calls)
  const urgentNotifications = notifications.filter(
    n => n.isPersistent && !n.read
  );
  const hasBillRequest = urgentNotifications.some(
    n => n.notificationType === 'bill-request'
  );
  const hasTableCall = urgentNotifications.some(
    n => n.notificationType === 'table-call'
  );
  
  // Animation for the indicator when new notifications arrive
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const urgentPulseAnim = useRef(new Animated.Value(1)).current;
  const hasAnimated = useRef(false);
  
  // Setup continuous pulse animation for urgent notifications
  useEffect(() => {
    let pulseAnimation;
    
    if (hasBillRequest || hasTableCall) {
      // Create a repeating pulse animation for urgent notifications
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(urgentPulseAnim, {
            toValue: 1.3,
            duration: hasBillRequest ? 500 : 800, // Faster pulse for bill requests
            useNativeDriver: true,
          }),
          Animated.timing(urgentPulseAnim, {
            toValue: 1,
            duration: hasBillRequest ? 500 : 800,
            useNativeDriver: true,
          }),
        ])
      );
      
      pulseAnimation.start();
    } else {
      // Reset animation when no urgent notifications
      Animated.timing(urgentPulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    
    return () => {
      if (pulseAnimation) {
        pulseAnimation.stop();
      }
    };
  }, [hasBillRequest, hasTableCall, urgentPulseAnim]);
  
  // Regular notification animation on count change
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
  }, [unreadCount, pulseAnim]);

  // Get appropriate icon and color based on notification status
  const getIconProps = () => {
    if (hasBillRequest) {
      return {
        name: "notifications-active",
        color: "#ef4444",  // Red for bill requests
        size: 24
      };
    } else if (hasTableCall) {
      return {
        name: "notifications-active", 
        color: "#f59e0b",  // Amber for table calls
        size: 22
      };
    } else {
      return {
        name: "notifications-none",
        color: isVisible ? "#3b82f6" : "#666",
        size: 20
      };
    }
  };
  
  const iconProps = getIconProps();

  return (
    <TouchableOpacity
      style={{
        padding: 4,
        marginRight: 4,
        position: 'relative',
      }}
      onPress={toggleNotificationPanel}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {/* Animated background for urgent notifications */}
      {(hasBillRequest || hasTableCall) && (
        <Animated.View
          style={{
            position: 'absolute',
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: hasBillRequest ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            transform: [{ scale: urgentPulseAnim }],
            top: -4,
            left: -4,
          }}
        />
      )}
      
      <MaterialIcons 
        name={iconProps.name}
        size={iconProps.size}
        color={iconProps.color}
      />
      
      {unreadCount > 0 && (
        <Animated.View 
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            backgroundColor: hasBillRequest ? '#ef4444' : (hasTableCall ? '#f59e0b' : (unreadCount > 5 ? '#ef4444' : '#f59e0b')),
            borderRadius: 8,
            minWidth: 16,
            height: 16,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 2,
            borderWidth: 1,
            borderColor: '#ffffff',
            transform: [{ scale: hasBillRequest || hasTableCall ? urgentPulseAnim : pulseAnim }],
          }}
        >
          <Text style={{
            color: '#fff',
            fontSize: 9,
            fontWeight: 'bold',
          }}>{unreadCount}</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

export default NotificationIndicator;