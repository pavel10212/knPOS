import React, { useState, useMemo } from "react";
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
  const [checkedItems, setCheckedItems] = useState({});
  const orders = useSharedStore((state) => state.orders);
  const menu = useSharedStore((state) => state.menu);
  const setIsLoggedIn = loginStore((state) => state.setIsLoggedIn);
  const setRole = loginStore((state) => state.setRole);

  // Create menuItems lookup map for O(1) access
  const menuItemsMap = useMemo(() => {
    return menu.menuItems?.reduce((acc, item) => {
      acc[item.menu_item_id] = item;
      return acc;
    }, {}) || {};
  }, [menu.menuItems]);

  // Transform orders into kitchen-friendly format
  const kitchenOrders = useMemo(() => {
    return orders
      .filter(order => order.order_status === 'Pending')
      .sort((a, b) => a.order_id - b.order_id)
      .map(order => {
        const orderDetails = typeof order.order_details === 'string'
          ? JSON.parse(order.order_details)
          : order.order_details;

        return {
          id: order.order_id,
          tableNum: order.table_num,
          items: orderDetails.map(detail => {
            const menuItem = menuItemsMap[detail.menu_item_id];
            return {
              name: menuItem?.menu_item_name || 'Unknown Item',
              quantity: detail.quantity,
              notes: detail.request || ''
            };
          })
        };
      });
  }, [orders, menuItemsMap]);


  const toggleItemCheck = async (orderId, itemIndex) => {
    try {
      // Get the new check state before updating
      const newCheckState = !checkedItems[`${orderId}-${itemIndex}`];

      setCheckedItems(prev => ({
        ...prev,
        [`${orderId}-${itemIndex}`]: newCheckState
      }));

      const currentOrder = orders.find(order => order.order_id === orderId);

      const orderDetails = typeof currentOrder.order_details === 'string'
        ? JSON.parse(currentOrder.order_details)
        : currentOrder.order_details;

      const updatedOrderDetails = orderDetails.map((detail, index) => {
        if (index === itemIndex) {
          return {
            ...detail,
            status: newCheckState ? 'Ready' : 'Pending'
          };
        }
        return detail;
      });

      const updatePayload = {
        order_id: orderId,
        order_status: currentOrder.order_status,
        completion_date_time: currentOrder.completion_date_time || null,
        order_details: JSON.stringify(updatedOrderDetails)
      };

      const response = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:3000/orders-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) throw new Error('Failed to update order');

      const updatedOrder = await response.json();

      // Update local state using the response from server
      const updatedOrders = orders.map(order =>
        order.order_id === orderId ? updatedOrder : order
      );
      useSharedStore.getState().setOrders(updatedOrders);

    } catch (error) {
      console.error('Error updating item status:', error);
      // Revert checkbox state on error
      setCheckedItems(prev => ({
        ...prev,
        [`${orderId}-${itemIndex}`]: !prev[`${orderId}-${itemIndex}`]
      }));
    }
  };


  const completeOrder = async (orderId) => {
    try {

      const currentOrder = orders.find(order => order.order_id === orderId);

      const orderDetails = typeof currentOrder.order_details === 'string'
        ? currentOrder.order_details
        : JSON.stringify(currentOrder.order_details);

      const updatePayload = {
        order_id: orderId,
        order_status: 'Ready',
        completion_date_time: new Date().toISOString(),
        order_details: orderDetails
      }


      const response = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:3000/orders-update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
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

export default KitchenHome;
