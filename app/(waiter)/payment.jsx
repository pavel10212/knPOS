import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { tableStore } from "../../hooks/useStore";
import { useMemo, useState, useCallback, useEffect } from "react";
import icons from "../../constants/icons";
import PayItem from "../../components/PayItem";
import { findOrdersForTable } from "../../utils/orderUtils";
import PaymentMethod from "../../components/PaymentMethod";
import { router } from "expo-router";
import { useSharedStore } from "../../hooks/useSharedStore";
import DiscountButton from "../../components/DiscountButton";
import { initializePrinter, printReceipt } from '../../utils/printerUtil';
import { updateOrderWithPayment } from '../../services/orderService';

const Payment = () => {
  const orders = useSharedStore((state) => state.orders);
  const selectedTable = tableStore((state) => state.selectedTable);
  const resetTableToken = tableStore((state) => state.resetTableToken);
  const menu = useSharedStore((state) => state.menu);
  const setOrders = useSharedStore((state) => state.setOrders);
  const inventory = useSharedStore((state) => state.inventory);

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);


  const DISCOUNT_OPTIONS = [0, 5, 10, 15, 20, 50];
  const CASH_AMOUNTS = [100, 200, 300, 500];

  const parsedOrder = useMemo(
    () => findOrdersForTable(selectedTable?.table_num, orders),
    [selectedTable?.table_num, orders]
  );

  // Modify the transformedOrder useMemo to combine identical items
  const transformedOrder = useMemo(() => {
    if (!parsedOrder?.length) return [];

    // Create temporaryItems array with all individual items
    const temporaryItems = parsedOrder.flatMap((order, orderIndex) =>
      order.order_details.map((orderDetail, detailIndex) => {
        // Check if the item is from inventory or menu
        if (orderDetail.type === 'inventory') {
          const inventoryItem = inventory?.find(
            (item) => item.inventory_item_id === orderDetail.inventory_item_id
          );
          return {
            id: `${order.order_id}-inv-${orderDetail.inventory_item_id}-${orderIndex}-${detailIndex}`,
            name: inventoryItem?.inventory_item_name,
            price: inventoryItem?.cost_per_unit,
            quantity: orderDetail.quantity,
            originalOrderId: order.order_id,
            originalInventoryItemId: orderDetail.inventory_item_id,
            type: 'inventory',
            // This key will be used for grouping
            groupKey: `inventory-${orderDetail.inventory_item_id}`
          };
        } else {
          const menuItem = menu?.find(
            (item) => item.menu_item_id === orderDetail.menu_item_id
          );
          return {
            id: `${order.order_id}-menu-${orderDetail.menu_item_id}-${orderIndex}-${detailIndex}`,
            name: menuItem?.menu_item_name,
            price: menuItem?.price,
            quantity: orderDetail.quantity,
            originalOrderId: order.order_id,
            originalMenuItemId: orderDetail.menu_item_id,
            type: 'menu',
            // This key will be used for grouping
            groupKey: `menu-${orderDetail.menu_item_id}`
          };
        }
      })
    );

    // Group items by groupKey and combine quantities
    const groupedItems = temporaryItems.reduce((acc, item) => {
      // If this groupKey doesn't exist yet, create it
      if (!acc[item.groupKey]) {
        acc[item.groupKey] = { ...item };
      } else {
        // If groupKey exists, add the quantity
        acc[item.groupKey].quantity += item.quantity;
        
        // Store multiple order IDs for reference if they're different
        if (acc[item.groupKey].originalOrderId !== item.originalOrderId) {
          if (!acc[item.groupKey].relatedOrderIds) {
            acc[item.groupKey].relatedOrderIds = [acc[item.groupKey].originalOrderId];
          }
          if (!acc[item.groupKey].relatedOrderIds.includes(item.originalOrderId)) {
            acc[item.groupKey].relatedOrderIds.push(item.originalOrderId);
          }
        }
      }
      return acc;
    }, {});

    // Convert the grouped object back to an array
    return Object.values(groupedItems);
  }, [parsedOrder, menu, inventory]);

  const [orderItems, setOrderItems] = useState(transformedOrder || []);

  useEffect(() => {
    setOrderItems(transformedOrder || []);
  }, [transformedOrder]);

  useEffect(() => {
    initializePrinter().catch(err => {
      console.error('Printer initialization failed:', err);
      Alert.alert('Printer Error', 'Failed to initialize printer');
    });
  }, []);

  const calculations = useMemo(() => {
    const subtotal =
      orderItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
      0;

    const discountAmount = subtotal * (discount / 100);
    const vat = subtotal * 0.1;
    const total = subtotal - discountAmount + vat;

    return {
      subtotal,
      serviceCharge: 0,
      discountAmount,
      vat,
      total,
    };
  }, [orderItems, discount]);

  const { subtotal, serviceCharge, discountAmount, vat, total } = calculations;

  // Optimize finish payment callback
  const finishPayment = useCallback(async () => {
    if (!selectedMethod) {
      Alert.alert("Error", "Please select a payment method");
      return;
    }

    if (selectedMethod === "cash" && cashReceived < calculations.total) {
      Alert.alert("Error", "Insufficient cash received");
      return;
    }

    try {
      // Create a map of orderItems for quick lookups
      const orderItemsMap = orderItems.reduce((acc, item) => {
        // Handle items with multiple related order IDs
        const orderIds = item.relatedOrderIds 
          ? [item.originalOrderId, ...item.relatedOrderIds] 
          : [item.originalOrderId];
          
        orderIds.forEach(orderId => {
          if (!acc[orderId]) acc[orderId] = [];
          acc[orderId].push(item);
        });
        return acc;
      }, {});

      const updatedOrders = await Promise.all(
        parsedOrder.map(async (order) => {
          const relevantItems = orderItemsMap[order.order_id] || [];
          
          const updatedOrderDetails = JSON.stringify(
            order.order_details.map((orderDetail) => {
              // Find matching item either by inventory_item_id or menu_item_id
              const matchingItem = relevantItems.find(
                (item) =>
                  (orderDetail.type === 'inventory' && 
                   item.originalInventoryItemId === orderDetail.inventory_item_id) ||
                  ((!orderDetail.type || orderDetail.type === 'menu') && 
                   item.originalMenuItemId === orderDetail.menu_item_id)
              );
              
              // If found matching item, use its quantity, otherwise use original quantity
              return {
                status: "completed",
                quantity: orderDetail.quantity,
                menu_item_id: orderDetail.menu_item_id,
                inventory_item_id: orderDetail.inventory_item_id,
                type: orderDetail.type || 'menu'
              };
            })
          );

          return await updateOrderWithPayment(order.order_id, updatedOrderDetails, {
            total: calculations.total
          });
        })
      );

      setOrders([
        ...orders.filter((order) => !parsedOrder.includes(order)),
        ...updatedOrders,
      ]);

      await resetTableToken(selectedTable.table_num);
      router.push("/home");
    } catch (error) {
      console.error("Error updating orders:", error);
      Alert.alert("Error", "Failed to complete payment");
    }
  }, [
    selectedMethod,
    cashReceived,
    calculations.total,
    parsedOrder,
    orderItems,
    selectedTable,
  ]);

  const handlePrintReceipt = async () => {
    try {
      const orderDetails = {
        tableNumber: selectedTable.table_num,
        items: orderItems
      };

      const paymentDetails = {
        subtotal,
        discount,
        discountAmount,
        vat,
        total,
        method: selectedMethod,
        cashReceived
      };

      await printReceipt(orderDetails, paymentDetails);
    } catch (error) {
      console.error('Failed to print receipt:', error);
      Alert.alert('Print Error', 'Failed to print receipt');
    }
  };

  if (!selectedTable) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Please select a table first</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Back Button */}
      <TouchableOpacity
        className="absolute top-4 left-4 z-10"
        onPress={() => router.back()}
      >
        <Text className="text-3xl">&lt;</Text>
      </TouchableOpacity>

      <View className="flex flex-row flex-1">
        {/* Left side - Order Items */}
        <View className="flex-1">
          <View className="p-4 justify-between flex flex-row">
            <View className="ml-8">
              <Text className="text-2xl font-bold">Order Details</Text>
            </View>
            <Text className="text-gray-500">Table {selectedTable?.number}</Text>
          </View>
          <View className="flex-1 m-5 rounded-lg">
            <View className="flex flex-row justify-between rounded-t-lg p-4 bg-[#EAF0F0]">
              <Text className="font-semibold w-[40%]">Item</Text>
              <Text className="font-semibold w-[20%] text-center">Price</Text>
              <Text className="font-semibold w-[20%] text-center">Quantity</Text>
              <Text className="font-semibold w-[20%] text-right">Subtotal</Text>
            </View>
            <FlatList
              data={orderItems}
              renderItem={({ item, index }) => (
                <PayItem
                  item={item}
                />
              )}
              keyExtractor={(item) => item.id}
            />
          </View>
        </View>

        {/* Right side - Payment Options */}
        <View className="w-[450px] relative">
          <View className="p-4 pb-20">
            <View className="mb-4">
              <Text className="text-2xl font-semibold mb-4">
                Payable Amount
              </Text>
              <Text className="text-xl font-medium text-[#D89F65]">
                ${total.toFixed(2)}
              </Text>

              {/* Payment Methods */}
              <View className="border-t border-dashed mt-4" />
              <View className="mt-4 flex flex-row items-center justify-center gap-4">
                <PaymentMethod
                  method="Cash"
                  icon={icons.money}
                  selected={selectedMethod === "cash"}
                  onSelect={() => setSelectedMethod("cash")}
                />
                <PaymentMethod
                  method="QR"
                  icon={icons.creditcard}
                  selected={selectedMethod === "qr"}
                  onSelect={() => setSelectedMethod("qr")}
                />
              </View>

              {/* Input Fields */}
              <View className="mt-4 space-y-0">
                <View className="border-t border-dashed mt-4" />
                <View className="mt-4 flex flex-row items-center justify-start gap-4 pb-4">
                  <Text className="font-semibold">Discount</Text>
                  <DiscountButton
                    percentage={0}
                    selected={discount === 0}
                    onSelect={setDiscount}
                    text="0%"
                  />
                  {DISCOUNT_OPTIONS.slice(1).map((percentage) => (
                    <DiscountButton
                      key={percentage}
                      percentage={percentage}
                      selected={discount === percentage}
                      onSelect={setDiscount}
                    />
                  ))}
                </View>
                {selectedMethod === "cash" && (
                  <View className="w-full bg-[#EAF0F0] p-4 rounded-lg space-y-6">
                    <View className="flex flex-row items-center justify-between">
                      <Text className="font-medium">Cash Received</Text>
                      <TextInput
                        className="border-b bg-white px-4 py-2 rounded-lg w-[120px] text-center"
                        placeholder="$0.00"
                        value={cashReceived.toString()}
                        onChangeText={(text) =>
                          setCashReceived(parseFloat(text) || 0)
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex flex-row flex-wrap gap-2 pt-4 justify-center">
                      <TouchableOpacity
                        key="exact"
                        onPress={() => setCashReceived(total.toFixed(2))}
                        className={`px-4 py-2 rounded-lg ${cashReceived === total.toFixed(2) ? "bg-primary" : "bg-white"}`}
                      >
                        <Text
                          className={`font-medium ${cashReceived === total.toFixed(2) ? "text-white" : "text-gray-700"}`}
                        >
                          Exact
                        </Text>
                      </TouchableOpacity>
                      {CASH_AMOUNTS.map((amount) => (
                        <TouchableOpacity
                          key={amount}
                          onPress={() => setCashReceived(amount)}
                          className={`px-4 py-2 rounded-lg ${cashReceived === amount ? "bg-primary" : "bg-white"
                            }`}
                        >
                          <Text
                            className={`font-medium ${cashReceived === amount
                              ? "text-white"
                              : "text-gray-700"
                              }`}
                          >
                            ${amount}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Summary */}
              <View className="mt-2">
                {[
                  { label: "Subtotal", value: subtotal },
                  { label: "Service Charge", value: serviceCharge },
                  {
                    label: `Discount (${discount}%)`,
                    value: -discountAmount,
                    isNegative: true,
                  },
                  { label: "VAT (10%)", value: vat },
                ].map(({ label, value, isNegative }) => (
                  <View key={label} className="flex flex-row justify-between">
                    <Text className="text-gray-600 text-sm">{label}</Text>
                    <Text
                      className={`font-medium text-sm ${isNegative ? "text-red-500" : ""
                        }`}
                    >
                      {isNegative ? "-" : ""}${Math.abs(value).toFixed(2)}
                    </Text>
                  </View>
                ))}
                <View className="flex flex-row justify-between pt-1 border-t border-dashed">
                  <Text className="font-bold">Total</Text>
                  <Text className="font-bold text-[#D89F65]">
                    ${total.toFixed(2)}
                  </Text>
                </View>

                {selectedMethod === "cash" && cashReceived > 0 && (
                  <View className="flex flex-row justify-between pt-1 border-t border-dashed">
                    <Text
                      className={`font-bold ${cashReceived > total ? "text-green-500" : "text-red-500"
                        }`}
                    >
                      Change
                    </Text>
                    <Text
                      className={`${cashReceived > total ? "text-green-500" : "text-red-500"
                        }`}
                    >
                      ${Math.abs(cashReceived - total).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

            </View>
          </View>

          {/* Action Buttons */}
          <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
            <View className="flex-row flex gap-4">
              <TouchableOpacity
                onPress={() => finishPayment()}
                className="flex-1 bg-primary p-4 rounded-lg"
              >
                <Text className="text-white text-center font-bold text-lg">
                  Complete
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePrintReceipt}
                className="flex-1 bg-[#64D393] p-4 rounded-lg"
              >
                <Text className="text-white text-center font-bold text-lg">
                  Print Receipt
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Payment;
