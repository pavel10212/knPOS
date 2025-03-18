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

  // Parse order details safely
  const parseOrderDetails = useCallback((orderDetails) => {
    if (!orderDetails) return [];
    
    try {
      if (typeof orderDetails === 'string') {
        return JSON.parse(orderDetails);
      }
      return Array.isArray(orderDetails) ? orderDetails : [];
    } catch (error) {
      console.error('Failed to parse order details:', error);
      return [];
    }
  }, []);

  // Get order items with proper error handling
  const orderItems = useMemo(() => {
    // First, safely get the order details
    const orderDetails = parseOrderDetails(order.order_details);
    
    // If we don't have valid order details, return empty array
    if (!orderDetails || !Array.isArray(orderDetails)) {
      return [];
    }
    
    return orderDetails.map((item) => {
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

      if (!itemDetails) return null;

      return {
        id: isInventory ? itemDetails.inventory_item_id : itemDetails.menu_item_id,
        name: isInventory ? itemDetails.inventory_item_name : itemDetails.menu_item_name,
        quantity: item.quantity || 0,
        price: isInventory ? itemDetails.cost_per_unit : itemDetails.price,
        request: isInventory ? null : (item.request || ''),
      };
    }).filter(Boolean);
  }, [order, menu, inventory, parseOrderDetails]);

  // Format the total amount with proper currency symbol
  const formattedTotal = useMemo(() => {
    if (typeof order.total_amount === 'number') {
      return `฿${order.total_amount.toFixed(2)}`;
    }
    return order.total || '฿0.00';
  }, [order.total_amount, order.total]);

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
          {orderItems.length > 0 ? (
            orderItems.map((item, index) => (
              <View
                key={`${item.id}-${index}`}
                className="py-2 border-t border-gray-200"
              >
                <View className="flex flex-row justify-between items-center">
                  <Text 
                    className="font-medium text-base flex-1 mr-2" 
                    numberOfLines={1} 
                    ellipsizeMode="tail"
                  >
                    {item.name}
                  </Text>
                  <Text className="font-medium text-sm">x{item.quantity}</Text>
                  <Text className="font-bold text-base ml-2">
                    ฿{(Number(item.price) || 0).toFixed(2)}
                  </Text>
                </View>
                {item.request ? (
                  <Text 
                    className="text-sm text-blue-600" 
                    numberOfLines={1} 
                    ellipsizeMode="tail"
                  >
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
              Total: {formattedTotal}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default OrderItem;
