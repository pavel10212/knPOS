import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
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
      {/* Static background for urgent notifications */}
      {(hasBillRequest || hasTableCall) && (
        <View
          style={{
            position: 'absolute',
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: hasBillRequest ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            top: -2,
            left: -2,
          }}
        />
      )}
      
      <MaterialIcons 
        name={iconProps.name}
        size={iconProps.size}
        color={iconProps.color}
      />
      
      {unreadCount > 0 && (
        <View 
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            backgroundColor: hasBillRequest ? '#ef4444' : (hasTableCall ? '#f59e0b' : (unreadCount > 5 ? '#ef4444' : '#f59e0b')),
            borderRadius: 8,
            minWidth: 16,
            height: 16,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 2,
            borderWidth: 1,
            borderColor: '#ffffff',
          }}
        >
          <Text style={{
            color: '#fff',
            fontSize: 9,
            fontWeight: 'bold',
          }}>{unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default NotificationIndicator;