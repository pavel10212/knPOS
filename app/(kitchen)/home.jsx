import React, {useState} from "react";
import {ScrollView, Text, TouchableOpacity, View} from "react-native";
import Checkbox from "expo-checkbox";
import Header from "../../components/Header";

const KitchenHome = () => {
  const [orders, setOrders] = useState([
    {
      id: 1,
      items: [
        { name: "Chicken Wings", notes: "Not spicy", quantity: 1 },
        { name: "Chicken Salad", notes: "", quantity: 1 },
        { name: "Cheese Burger Beef", notes: "No pickles", quantity: 2 },
        { name: "Coca Cola", notes: "", quantity: 2 },
        { name: "Coca Cola", notes: "", quantity: 2 },
        { name: "Coca Cola", notes: "", quantity: 2 },
        { name: "Coca Cola", notes: "", quantity: 2 },
        { name: "Coca Cola", notes: "", quantity: 2 },
      ],
    },
    {
      id: 2,
      items: [
        { name: "Chicken Wings", notes: "Not spicy", quantity: 1 },
        { name: "Coca Cola", notes: "", quantity: 1 },
      ],
    },
    {
      id: 3,
      items: [
        { name: "Chicken Salad", notes: "Extra dressing", quantity: 1 },
        { name: "Coca Cola", notes: "", quantity: 2 },
      ],
    },
    {
      id: 4,
      items: [
        { name: "Chicken Salad", notes: "Extra dressing", quantity: 1 },
        { name: "Coca Cola", notes: "", quantity: 2 },
      ],
    },
    {
      id: 5,
      items: [
        { name: "Chicken Salad", notes: "Extra dressing", quantity: 1 },
        { name: "Coca Cola", notes: "", quantity: 2 },
      ],
    },
    {
      id: 6,
      items: [
        { name: "Chicken Salad", notes: "Extra dressing", quantity: 1 },
        { name: "Coca Cola", notes: "", quantity: 2 },
      ],
    },
    {
      id: 7,
      items: [
        { name: "Chicken Salad", notes: "Extra dressing", quantity: 1 },
        { name: "Coca Cola", notes: "", quantity: 2 },
      ],
    },
    {
      id: 8,
      items: [
        { name: "Chicken Salad", notes: "Extra dressing", quantity: 1 },
        { name: "Coca Cola", notes: "", quantity: 2 },
      ],
    },
  ]);

  const [checkedItems, setCheckedItems] = useState({});

  const toggleItemCheck = (orderId, itemIndex) => {
    setCheckedItems((prev) => ({
      ...prev,
      [`${orderId}-${itemIndex}`]: !prev[`${orderId}-${itemIndex}`],
    }));
  };

  const completeOrder = (orderId) => {
    // Placeholder for backend integration
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.id !== orderId)
    );
  };

  return (
    <View className="flex-1 bg-background">
      <Header />
      <View className="px-4 py-6 w-full">
        <View className="flex-row justify-between items-center mb-4 pr-2">
          <Text className="text-2xl font-bold">ORDER LIST</Text>
          <TouchableOpacity
            className="bg-primary px-4 py-2 rounded-lg"
            onPress={() => {
              /* Add waiter call logic here */
            }}
          >
            <Text className="text-white">REQUEST WAITER</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal className="flex-row space-x-6">
          {orders.map((order) => (
            <View
              key={order.id}
              className="bg-white w-64 rounded-lg shadow p-4 mx-2"
            >
              <Text className="text-xl font-bold mb-3">Order #{order.id}</Text>
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
                          color={
                            checkedItems[`${order.id}-${index}`]
                              ? "#8390DA"
                              : undefined
                          }
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
