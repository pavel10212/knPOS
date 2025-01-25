import { Text, TouchableOpacity, View } from "react-native";
import { useState, useMemo, useCallback } from "react";
import { useSharedStore } from "../hooks/useSharedStore";
import { router } from "expo-router";

const OrderItem = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const menu = useSharedStore((state) => state.menu);

  const handleDropdownClick = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleEditOrder = useCallback(() => {
    router.push({
      pathname: "editOrAddOrder",
      params: {
        order: order.order_id,
      },
    });
  }, [order.order_id]);

  const orderItems = useMemo(
    () =>
      order.order_details?.map((item) => {
        const menuItem = menu?.menuItems?.find(
          (mi) => mi.menu_item_id === item.menu_item_id
        );
        return {
          id: item.menu_item_id,
          name:
            menuItem?.menu_item_name || `Unknown Item #${item.menu_item_id}`,
          quantity: item.quantity,
          price: menuItem?.price || 0,
          request: item.request || "",
        };
      }),
    [order, menu?.menuItems, order]
  );

  return (
    <View className="rounded-xl bg-[#e7edf7] shadow-md mb-4 p-4">
      <TouchableOpacity
        onPress={handleDropdownClick}
        className="flex flex-row items-center justify-between"
      >
        <Text className="font-semibold text-lg">
          Order ID: {order.order_id}
        </Text>
        <TouchableOpacity onPress={() => handleEditOrder()}>
          <Text className="text-blue-600">Edit</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {isExpanded && (
        <View className="mt-4">
          {orderItems?.map((item, index) => (
            <View
              key={`${item.id}-${index}`}
              className="py-2 border-t border-gray-200"
            >
              <View className="flex flex-row justify-between items-center">
                <Text className="font-medium text-base">{item.name}</Text>
                <Text className="font-medium text-sm">x{item.quantity}</Text>
                <Text className="font-bold text-base">
                  ${Number(item.price).toFixed(2)}
                </Text>
              </View>
              <Text className="text-sm text-blue-600">
                Notes: {item.request || "Add notes..."}
              </Text>
            </View>
          ))}
          <View className="py-4 border-t flex flex-row justify-between border-gray-200">
            <Text className="font-bold text-right text-lg">
              Total: {order.total}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default OrderItem;
