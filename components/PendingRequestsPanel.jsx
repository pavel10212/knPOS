import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useNotificationStore } from '../hooks/useNotificationStore';
import { useSocketStore } from '../hooks/useSocket';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';

const PendingRequestsPanel = () => {
  // Get pending requests from both notification and socket stores
  const { getPendingNotifications, resolveTableRequest } = useNotificationStore();
  const { getPendingRequestTables, clearPendingRequest } = useSocketStore();
  
  const [isVisible, setIsVisible] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  
  // Animation values
  const slideAnim = React.useRef(new Animated.Value(100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  
  // Check for pending requests every second
  useEffect(() => {
    const interval = setInterval(() => {
      const pendingTables = getPendingRequestTables();
      if (pendingTables.length > 0 && !isVisible) {
        setIsVisible(true);
        showPanel();
      } else if (pendingTables.length === 0 && isVisible) {
        hidePanel();
      }
      
      // Update and sort the pending requests
      const sortedRequests = [...pendingTables].sort((a, b) => {
        // Sort by type (bill first) then by time
        if (a.type === 'bill-request' && b.type !== 'bill-request') return -1;
        if (b.type === 'bill-request' && a.type !== 'bill-request') return 1;
        return new Date(a.timestamp) - new Date(b.timestamp);
      });
      
      setPendingRequests(sortedRequests);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isVisible]);
  
  const showPanel = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  const hidePanel = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsVisible(false);
    });
  };
  
  const handleResolve = (tableNum) => {
    resolveTableRequest(tableNum);
    clearPendingRequest(tableNum);
  };
  
  const getTypeIcon = (type) => {
    if (type === 'bill-request') {
      return <FontAwesome name="money" size={16} color="#fff" />;
    } else {
      return <MaterialIcons name="priority-high" size={16} color="#fff" />;
    }
  };
  
  const getElapsedTime = (timestamp) => {
    const now = new Date();
    const requestTime = new Date(timestamp);
    const minutes = Math.floor((now - requestTime) / 1000 / 60);
    
    if (minutes < 1) return 'Just now';
    return `${minutes} min`;
  };
  
  // Don't render anything if no pending requests
  if (!isVisible) return null;
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Pending Requests</Text>
      </View>
      
      <View style={styles.requestsContainer}>
        {pendingRequests.map((request) => (
          <View key={`${request.tableNum}-${request.type}`} style={styles.requestItem}>
            <View style={[
              styles.iconContainer,
              request.type === 'bill-request' ? styles.billIcon : styles.callIcon
            ]}>
              {getTypeIcon(request.type)}
            </View>
            
            <View style={styles.requestInfo}>
              <Text style={styles.tableText}>
                Table {request.tableNum}
              </Text>
              <Text style={styles.timeText}>
                {getElapsedTime(request.timestamp)}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => handleResolve(request.tableNum)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.6}
            >
              <Text style={styles.resolveText}>Resolve</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 1000,
  },
  header: {
    backgroundColor: '#8390DA',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  requestsContainer: {
    maxHeight: 200,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billIcon: {
    backgroundColor: '#ef4444',
  },
  callIcon: {
    backgroundColor: '#f59e0b',
  },
  requestInfo: {
    flex: 1,
  },
  tableText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#1f2937',
  },
  timeText: {
    fontSize: 11,
    color: '#6b7280',
  },
  resolveButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  resolveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PendingRequestsPanel;