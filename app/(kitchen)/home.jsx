import React, { useState, useMemo, useEffect } from "react";
import { ScrollView, Text, TouchableOpacity, View, Image } from "react-native";
import Checkbox from "expo-checkbox";
import Header from "../../components/Header";
import { useKitchenData } from "../../hooks/useKitchenData";
import { useSharedStore } from "../../hooks/useSharedStore";
import { loginStore } from "../../hooks/useStore";
import icons from "../../constants/icons";
import { router } from "expo-router";

const KitchenHome = () => {
  useKitchenData();
  const orders = useSharedStore((state) => state.orders);
  const menu = useSharedStore((state) => state.menu);
  const [checkedItems, setCheckedItems] = useState({});
  const setIsLoggedIn = loginStore((state) => state.setIsLoggedIn);
  const setRole = loginStore((state) => state.setRole);

  // Transform orders into kitchen-friendly format
  const kitchenOrders = useMemo(() => {
    return orders
      .filter(order => order.order_status === 'Pending')
      .map(order => {
        const orderDetails = typeof order.order_details === 'string'
          ? JSON.parse(order.order_details)
          : order.order_details;

        return {
          id: order.order_id,
          tableNum: order.table_num,
          items: orderDetails.map(detail => {
            const menuItem = menu.menuItems?.find(item =>
              item.menu_item_id === detail.menu_item_id
            );
            return {
              name: menuItem?.menu_item_name || 'Unknown Item',
              quantity: detail.quantity,
              notes: detail.notes || ''
            };
          })
        };
      });
  }, [orders, menu]);

  useEffect(() => {
    console.log(orders, "orders");
  }, [orders]);

  const toggleItemCheck = (orderId, itemIndex) => {
    setCheckedItems(prev => ({
      ...prev,
      [`${orderId}-${itemIndex}`]: !prev[`${orderId}-${itemIndex}`]
    }));
  };

  const completeOrder = async (orderId) => {
    try {
      const response = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:3000/orders-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          order_status: 'Ready',
          completion_date_time: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Failed to update order');

      // Update local state through useSharedStore
      const updatedOrders = orders.map(order =>
        order.order_id === orderId
          ? { ...order, order_status: 'Ready' }
          : order
      );
      useSharedStore.getState().setOrders(updatedOrders);

    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <Header />
      <View className="px-4 py-6 w-full">
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
        <ScrollView horizontal className="flex-row space-x-6">
          {kitchenOrders.map((order) => (
            <View key={order.id} className="bg-white w-64 rounded-lg shadow p-4 mx-2">
              <Text className="text-xl font-bold mb-3">
                Order #{order.id} - Table {order.tableNum}
              </Text>
              <ScrollView className="space-y-3">
                {order.items.map((item, index) => (
                  <View key={index} className="border-b border-gray-200 pb-3">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-base font-semibold flex-1">
                        {item.name}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-base font-semibold">
                          x{item.quantity}
                        </Text>
                        <Checkbox
                          style={{ marginLeft: 4 }}
                          value={checkedItems[`${order.id}-${index}`]}
                          onValueChange={() => toggleItemCheck(order.id, index)}
                          color={checkedItems[`${order.id}-${index}`] ? "#8390DA" : undefined}
                        />
                      </View>
                    </View>
                    {item.notes && (
                      <Text className="text-sm text-gray-500 mt-1">
                        Note: {item.notes}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity
                className="bg-primary rounded-lg mt-4 py-3"
                onPress={() => completeOrder(order.id)}
              >
                <Text className="text-white text-center text-base font-bold">
                  Complete
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default KitchenHome;
