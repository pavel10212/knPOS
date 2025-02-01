import React, { useState, useMemo, useCallback } from "react";
import { ScrollView, Text, TouchableOpacity, View, Image } from "react-native";
import Checkbox from "expo-checkbox";
import Header from "../../components/Header";
import { useKitchenData } from "../../hooks/useKitchenData";
import { useSharedStore } from "../../hooks/useSharedStore";
import { loginStore } from "../../hooks/useStore";
import icons from "../../constants/icons";
import { router } from "expo-router";
import { useSocketStore } from "../../hooks/useSocket";

// Utility function moved outside component
const parseOrderDetails = (details) =>
  typeof details === 'string' ? JSON.parse(details) : details;

// Custom hook for menu items map
const useMenuItemsMap = (menuItems) => {
  return useMemo(() =>
    menuItems?.reduce((acc, item) => {
      acc[item.menu_item_id] = item;
      return acc;
    }, {}) || {},
    [menuItems]
  );
};

const KitchenHome = () => {
  useKitchenData();
  const orders = useSharedStore((state) => state.orders);
  const menu = useSharedStore((state) => state.menu);
  const setIsLoggedIn = loginStore((state) => state.setIsLoggedIn);
  const setRole = loginStore((state) => state.setRole);

  // Initialize checkedItems based on order status
  const [checkedItems, setCheckedItems] = useState(() => {
    const initialState = {};
    orders.forEach(order => {
      const details = parseOrderDetails(order.order_details);
      details.forEach((item, index) => {
        if (item.status === 'Ready') {
          initialState[`${order.order_id}-${index}`] = true;
        }
      });
    });
    return initialState;
  });

  const menuItemsMap = useMenuItemsMap(menu);

  // Optimize orders transformation
  const kitchenOrders = useMemo(() => {
    return orders
      .filter(order => order.order_status === 'Pending' )
      .sort((a, b) => a.order_id - b.order_id)
      .map(order => ({
        id: order.order_id,
        tableNum: order.table_num,
        items: parseOrderDetails(order.order_details)
            .filter(detail => detail.type !== 'inventory')
            .map(detail => ({
          name: menuItemsMap[detail.menu_item_id]?.menu_item_name || 'Unknown Item',
          quantity: detail.quantity,
          notes: detail.request || '',
          status: detail.status || 'Pending'
        }))
      }));
  }, [orders, menuItemsMap]);

  // Consolidated update order function
  const updateOrder = useCallback(async (orderId, updateData) => {
    try {
      const response = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:3000/orders-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) throw new Error('Failed to update order');

      const updatedOrder = await response.json();
      useSharedStore.getState().setOrders(
        orders.map(order => order.order_id === orderId ? updatedOrder : order)
      );

      await useSocketStore.getState().trackUpdatedOrder(orderId);
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      return false;
    }
  }, [orders]);

  const toggleItemCheck = useCallback(async (orderId, itemIndex) => {
    const newCheckState = !checkedItems[`${orderId}-${itemIndex}`];
    const currentOrder = orders.find(order => order.order_id === orderId);
    if (!currentOrder) return;

    const orderDetails = parseOrderDetails(currentOrder.order_details);
    
    // Update the status in orderDetails
    orderDetails[itemIndex].status = newCheckState ? 'Ready' : 'Pending';

    const success = await updateOrder(orderId, {
      ...currentOrder,
      order_details: JSON.stringify(orderDetails),
      // If all items are ready, update order_status
      order_status: orderDetails.every(item => item.status === 'Ready') ? 'Ready' : 'Pending'
    });

    if (success) {
      setCheckedItems(prev => ({
        ...prev,
        [`${orderId}-${itemIndex}`]: newCheckState
      }));
    }
  }, [checkedItems, orders, updateOrder]);

  const completeOrder = useCallback(async (orderId) => {
    const currentOrder = orders.find(order => order.order_id === orderId);
    if (!currentOrder) return;

    await updateOrder(orderId, {
      ...currentOrder,
      order_status: 'Ready',
      completion_date_time: new Date().toISOString()
    });
  }, [orders, updateOrder]);

  return (
    <View className="flex-1 bg-background">
      <Header />
      <View className="px-4 py-6 flex-1">
        <View className="flex-row justify-between items-center mb-4 pr-2">
          <Text className="text-2xl font-bold">ORDER LIST</Text>
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity
              className="bg-primary px-4 py-2 rounded-lg"
              onPress={() => {/* Add waiter call logic here */ }}
            >
              <Text className="text-white">REQUEST WAITER</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-transparent border border-red-500 px-3 py-2 rounded-lg flex-row items-center"
              onPress={() => {
                setRole('');
                setIsLoggedIn(false);
                router.push('/');
              }}>
              <Image
                source={icons.logout}
                resizeMode="contain"
                tintColor="#EF4444"
                className="w-4 h-4"
              />
              <Text className="ml-2 text-red-500 font-medium text-sm">
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row flex-wrap justify-start gap-4 pb-4">
            {kitchenOrders.map((order) => (
              <View
                key={order.id}
                className="bg-white w-[300px] rounded-lg shadow-lg p-4 border border-gray-100"
              >
                <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-gray-100">
                  <View>
                    <Text className="text-xl font-bold text-primary">
                      Table {order.tableNum}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Order #{order.id}
                    </Text>
                  </View>
                  <View className="bg-yellow-100 px-3 py-1 rounded-full">
                    <Text className="text-yellow-700 font-medium">Pending</Text>
                  </View>
                </View>

                <ScrollView className="max-h-[300px]">
                  <View className="space-y-3">
                    {order.items.map((item, index) => (
                      <View
                        key={index}
                        className={`p-3 rounded-lg ${checkedItems[`${order.id}-${index}`]
                          ? 'bg-gray-50'
                          : 'bg-white'
                          }`}
                      >
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1">
                            <Text className="text-base font-semibold">
                              {item.name}
                            </Text>
                            <Text className="text-sm text-gray-500">
                              Quantity: {item.quantity}
                            </Text>
                          </View>
                          <Checkbox
                            style={{ marginLeft: 8 }}
                            value={checkedItems[`${order.id}-${index}`]}
                            onValueChange={() => toggleItemCheck(order.id, index)}
                            color={checkedItems[`${order.id}-${index}`] ? "#8390DA" : undefined}
                          />
                        </View>
                        {item.notes && (
                          <View className="mt-2 bg-gray-50 p-2 rounded">
                            <Text className="text-sm text-gray-600">
                              {item.notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </ScrollView>

                <TouchableOpacity
                  className="bg-primary rounded-lg mt-4 py-3 shadow-sm"
                  onPress={() => completeOrder(order.id)}
                >
                  <Text className="text-white text-center text-base font-bold">
                    Mark as Complete
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

// Optimize component export with memo
export default React.memo(KitchenHome);
