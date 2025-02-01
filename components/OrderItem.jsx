import { Text, TouchableOpacity, View } from "react-native";
import { useState, useMemo, useCallback } from "react";
import { useSharedStore } from "../hooks/useSharedStore";
import { router } from "expo-router";

const OrderItem = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const menu = useSharedStore((state) => state.menu);
  const inventory = useSharedStore((state) => state.inventory);

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
      order.items?.map((item) => {
        if (!item) return null;

        const isInventory = item.type === "inventory";
        let itemDetails = null;

        if (isInventory) {
          itemDetails = inventory?.find(
            (inv) => inv?.inventory_item_id === item.inventory_item_id
          );
        } else {
          itemDetails = menu?.find(
            (menuItem) => menuItem?.menu_item_id === item.menu_item_id
          );
        }

        if (!itemDetails) {
          return {
            id: item.menu_item_id || item.inventory_item_id || 'unknown',
            name: 'Unknown Item',
            quantity: item.quantity || 0,
            price: 0,
            request: item.request || '',
          };
        }

        return {
          id: isInventory ? itemDetails.inventory_item_id : itemDetails.menu_item_id,
          name: isInventory ? itemDetails.inventory_item_name : itemDetails.menu_item_name,
          quantity: item.quantity || 0,
          price: isInventory ? itemDetails.cost_per_unit : itemDetails.price,
          request: isInventory ? null : (item.request || ''),
        };
      }).filter(Boolean), // Remove any null items
    [order.items, menu, inventory]
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
          {orderItems?.length > 0 ? (
            orderItems.map((item, index) => (
              <View
                key={`${item.id}-${index}`}
                className="py-2 border-t border-gray-200"
              >
                <View className="flex flex-row justify-between items-center">
                  <Text className="font-medium text-base">{item.name}</Text>
                  <Text className="font-medium text-sm">x{item.quantity}</Text>
                  <Text className="font-bold text-base">
                    ${(Number(item.price) || 0).toFixed(2)}
                  </Text>
                </View>
                {item.request ? (
                  <Text className="text-sm text-blue-600">
                    Request: {item.request}
                  </Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text className="text-gray-500">No items in this order</Text>
          )}
          <View className="py-4 border-t flex flex-row justify-between border-gray-200">
            <Text className="font-bold text-right text-lg">
              Total: {order.total || '$0.00'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default OrderItem;
