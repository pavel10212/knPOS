import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useNotificationStore } from '../hooks/useNotificationStore';
import { AntDesign } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NotificationToast = () => {
  const { activeToast, clearActiveToast, showNotificationPanel } = useNotificationStore();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeToast) {
      // Show toast
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Hide toast
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeToast]);

  if (!activeToast) return null;

  // Get notification icon and color based on type
  const getIconAndColor = (type) => {
    switch(type) {
      case 'success': 
        return { icon: 'checkcircle', color: '#22c55e' };
      case 'error': 
        return { icon: 'closecircle', color: '#ef4444' };
      case 'warning':
        return { icon: 'warning', color: '#f59e0b' };
      case 'info': 
      default:
        return { icon: 'infocirlce', color: '#3b82f6' };
    }
  };

  const { icon, color } = getIconAndColor(activeToast.type);

  const handleViewAll = () => {
    clearActiveToast();
    showNotificationPanel();
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        {
          paddingTop: insets.top > 0 ? insets.top : 10,
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <AntDesign name={icon} size={18} color="#fff" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{activeToast.text1}</Text>
          {activeToast.text2 && (
            <Text style={styles.message}>{activeToast.text2}</Text>
          )}
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleViewAll}
          >
            <Text style={styles.viewAllText}>View</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.closeButton]}
            onPress={clearActiveToast}
          >
            <AntDesign name="close" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1100,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1c',
    padding: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  message: {
    color: '#d1d5db',
    fontSize: 13,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 5,
    marginLeft: 5,
  },
  viewAllText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 13,
  },
  closeButton: {
    marginLeft: 5,
  },
});

export default NotificationToast;