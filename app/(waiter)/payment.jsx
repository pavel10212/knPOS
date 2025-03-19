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
import { useReservationStore } from "../../hooks/useReservationStore";
import { fetchAdminSettings } from "../../services/adminSettingsService";

const Payment = () => {
  const orders = useSharedStore((state) => state.orders);
  const selectedTable = tableStore((state) => state.selectedTable);
  const resetTableToken = tableStore((state) => state.resetTableToken);
  const menu = useSharedStore((state) => state.menu);
  const setOrders = useSharedStore((state) => state.setOrders);
  const inventory = useSharedStore((state) => state.inventory);
  // Add reservation store to access its functions
  const { todayReservations, upcomingGroupedByDate, updateReservationStatus } = useReservationStore();

  const [selectedMethod, setSelectedMethod] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [cashReceived, setCashReceived] = useState(0);
  const [disableButton, setDisableButton] = useState(false);
  const [adminSettings, setAdminSettings] = useState({
    vat_rate: 7, // Default 7%
    service_charge_rate: 10, // Default 10%
    allowed_discount_options: [0, 5, 10, 15, 20, 50], // Default discount options
    cash_amount_options: [100, 200, 300, 500] // Default cash amount options
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Use admin settings or fall back to defaults
  const DISCOUNT_OPTIONS = adminSettings.allowed_discount_options || [0, 5, 10, 15, 20, 50];
  const CASH_AMOUNTS = adminSettings.cash_amount_options || [100, 200, 300, 500];

  // Fetch admin settings from the server
  useEffect(() => {
    const loadAdminSettings = async () => {
      try {
        setIsLoadingSettings(true);
        const data = await fetchAdminSettings();
        
        // Process the settings into a usable format
        const settings = {};
        
        // Map the correct setting keys from the database to our internal keys
        data.forEach(item => {
          if (item.setting_key === 'vat_percentage') {
            settings.vat_rate = parseFloat(item.setting_value) || 7;
          } 
          else if (item.setting_key === 'service_charge_percentage') {
            settings.service_charge_rate = parseFloat(item.setting_value) || 10;
          }
          else if (item.setting_key === 'allowed_discount_options') {
            try {
              settings.allowed_discount_options = JSON.parse(item.setting_value);
            } catch (e) {
              console.error('Failed to parse discount options:', e);
            }
          }
          else if (item.setting_key === 'cash_amount_options') {
            try {
              settings.cash_amount_options = JSON.parse(item.setting_value);
            } catch (e) {
              console.error('Failed to parse cash options:', e);
            }
          }
          // Store other settings we might need
          else {
            settings[item.setting_key] = item.setting_value;
          }
        });
        
        setAdminSettings(prevSettings => ({...prevSettings, ...settings}));
      } catch (error) {
        console.error('Error fetching admin settings:', error);
        // Continue with default values
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadAdminSettings();
  }, []);

  const parsedOrder = useMemo(
    () => findOrdersForTable(selectedTable?.table_num, orders),
    [selectedTable?.table_num, orders]
  );

  // Modify the transformedOrder useMemo to combine identical items
  const transformedOrder = useMemo(() => {
    if (!parsedOrder?.length) return [];

    // Create temporaryItems array with all individual items
    const temporaryItems = parsedOrder.flatMap((order, orderIndex) => {
      // Safely parse order details
      let details = [];
      try {
        details = typeof order.order_details === 'string' 
          ? JSON.parse(order.order_details) 
          : Array.isArray(order.order_details) 
            ? order.order_details 
            : [];
      } catch (error) {
        console.error('Failed to parse order details:', error);
        return [];
      }

      if (!Array.isArray(details)) {
        console.error('Order details is not an array:', order.order_id);
        return [];
      }

      return details.map((orderDetail, detailIndex) => {
        if (!orderDetail) return null;

        // Check if the item is from inventory or menu
        if (orderDetail.type === 'inventory') {
          const inventoryItem = inventory?.find(
            (item) => item.inventory_item_id === orderDetail.inventory_item_id
          );
          if (!inventoryItem) return null;
          
          return {
            id: `${order.order_id}-inv-${orderDetail.inventory_item_id}-${orderIndex}-${detailIndex}`,
            name: inventoryItem.inventory_item_name || 'Unknown Item',
            price: inventoryItem.cost_per_unit || 0,
            quantity: orderDetail.quantity || 0,
            originalOrderId: order.order_id,
            originalInventoryItemId: orderDetail.inventory_item_id,
            type: 'inventory',
            groupKey: `inventory-${orderDetail.inventory_item_id}`
          };
        } else {
          const menuItem = menu?.find(
            (item) => item.menu_item_id === orderDetail.menu_item_id
          );
          if (!menuItem) return null;

          return {
            id: `${order.order_id}-menu-${orderDetail.menu_item_id}-${orderIndex}-${detailIndex}`,
            name: menuItem.menu_item_name || 'Unknown Item',
            price: menuItem.price || 0,
            quantity: orderDetail.quantity || 0,
            originalOrderId: order.order_id,
            originalMenuItemId: orderDetail.menu_item_id,
            type: 'menu',
            groupKey: `menu-${orderDetail.menu_item_id}`
          };
        }
      }).filter(Boolean); // Remove any null items
    });

    // Group items by groupKey and combine quantities
    const groupedItems = temporaryItems.reduce((acc, item) => {
      if (!item || !item.groupKey) return acc;

      // If this groupKey doesn't exist yet, create it
      if (!acc[item.groupKey]) {
        acc[item.groupKey] = { ...item };
      } else {
        // If groupKey exists, add the quantity
        acc[item.groupKey].quantity += (item.quantity || 0);
        
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
    // Initialize printer without blocking or crashing if it fails
    const initPrinter = async () => {
      try {
        const success = await initializePrinter();
        if (!success) {
          console.log("Printer initialization deferred - will retry when printing");
        }
      } catch (err) {
        // Log but don't alert since this is just initial connection
        console.warn('Initial printer connection deferred:', err.message);
      }
    };
    
    // Use a slight delay to prevent initialization during critical app startup
    const timer = setTimeout(() => {
      initPrinter();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const calculations = useMemo(() => {
    const subtotal =
      orderItems?.reduce((sum, item) => sum + item.price * item.quantity, 0) ||
      0;

    // Use admin settings for tax rate and service charge
    const discountAmount = subtotal * (discount / 100);
    const vatRate = adminSettings.vat_rate / 100;
    const serviceChargeRate = adminSettings.service_charge_rate / 100;
    
    const vat = subtotal * vatRate;
    const serviceCharge = subtotal * serviceChargeRate;
    const total = subtotal - discountAmount + vat + serviceCharge;

    return {
      subtotal,
      serviceCharge,
      discountAmount,
      vat,
      total,
    };
  }, [orderItems, discount, adminSettings.vat_rate, adminSettings.service_charge_rate]);

  const { subtotal, serviceCharge, discountAmount, vat, total } = calculations;

  // Find active reservation for the current table
  const findActiveReservation = useCallback(() => {
    if (!selectedTable || !selectedTable.table_num) return null;
    
    console.log(`Looking for active reservation for table ${selectedTable.table_num}`);
    
    // Combine all reservations for easier searching
    const allReservations = [];
    if (todayReservations && todayReservations.length) {
      console.log(`Found ${todayReservations.length} reservations for today`);
      allReservations.push(...todayReservations);
    }
    
    if (upcomingGroupedByDate) {
      Object.values(upcomingGroupedByDate).forEach(dateReservations => {
        allReservations.push(...dateReservations);
      });
    }
    
    console.log(`Total reservations to search: ${allReservations.length}`);
    
    // Find any reservation for this table that's in 'seated' status
    const tableReservations = allReservations.filter(res => {
      // Find matching table_id and correct status
      const tableMatch = res.table_id === selectedTable.table_id || 
                         res.table_num === selectedTable.table_num ||
                         String(res.table_id) === String(selectedTable.table_num);
      
      const statusMatch = res.status === 'seated';
      
      if (tableMatch && statusMatch) {
        console.log(`Found matching reservation: ${res.reservation_id} for ${res.customer_name}`);
      }
      
      return tableMatch && statusMatch;
    });
    
    if (tableReservations.length > 0) {
      console.log(`Found ${tableReservations.length} active reservations for this table`);
      return tableReservations[0]; // Return the first matching reservation
    }
    
    console.log('No active reservations found for this table');
    return null;
  }, [selectedTable, todayReservations, upcomingGroupedByDate]);

  // Optimize finish payment callback
const finishPayment = useCallback(async () => {
    try {
      console.log("Starting order submission process...");
      setDisableButton(true);
      
      if (!selectedTable) {
        console.log("No table selected, aborting order submission");
        setDisableButton(false);
        return;
      }

      if (!parsedOrder?.length) {
        console.log("No orders found for table, aborting payment");
        setDisableButton(false);
        return;
      }
      
      // Create a map of orderItems for quick lookups
      const orderItemsMap = (orderItems || []).reduce((acc, item) => {
        if (!item?.originalOrderId) return acc;
        
        const orderIds = item.relatedOrderIds 
          ? [item.originalOrderId, ...item.relatedOrderIds] 
          : [item.originalOrderId];
          
        orderIds.forEach(orderId => {
          if (!acc[orderId]) acc[orderId] = [];
          acc[orderId].push(item);
        });
        return acc;
      }, {});

      // First, update all orders to completed status
      const updatedOrders = await Promise.all(
        parsedOrder.map(async (order) => {
          // Safely parse or handle order details
          let orderDetails = [];
          try {
            orderDetails = typeof order.order_details === 'string'
              ? JSON.parse(order.order_details)
              : Array.isArray(order.order_details) 
                ? order.order_details 
                : [];
          } catch (error) {
            console.error('Failed to parse order details:', error);
            orderDetails = [];
          }

          if (!Array.isArray(orderDetails)) {
            console.error('Order details is not an array:', order.order_id);
            orderDetails = [];
          }

          const updatedOrderDetails = JSON.stringify(
            orderDetails.map((orderDetail) => ({
              ...orderDetail,
              status: "completed",
              menu_item_id: orderDetail.menu_item_id,
              inventory_item_id: orderDetail.inventory_item_id,
              type: orderDetail.type || 'menu',
              quantity: orderDetail.quantity || 0,
              request: orderDetail.request || ""
            }))
          );

          return await updateOrderWithPayment(order.order_id, updatedOrderDetails, {
            total: calculations.total,
            tipAmount: 0,
          });
        })
      );

      // Update orders in the store to reflect completed status
      setOrders(prevOrders => {
        const nonTableOrders = (prevOrders || []).filter(order => 
          !parsedOrder.find(po => po.order_id === order.order_id)
        );
        return [...nonTableOrders, ...updatedOrders];
      });

      // Check for active reservation and mark as completed
      const activeReservation = findActiveReservation();
      if (activeReservation) {
        console.log(`Marking reservation ${activeReservation.reservation_id} as completed after payment`);
        await updateReservationStatus(activeReservation.reservation_id, 'completed');
      }

      // Mark the table as Available again
      await resetTableToken(selectedTable.table_num);
      router.push("/home");

    } catch (error) {
      console.error("Error handling order:", error);
      Alert.alert("Error", "Failed to complete payment");
    } finally {
      setDisableButton(false);
    }
  }, [selectedTable, parsedOrder, orderItems, calculations.total, findActiveReservation, updateReservationStatus, resetTableToken]);

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
        serviceCharge,
        total,
        method: selectedMethod,
        cashReceived,
        vatRate: adminSettings.vat_rate,
        serviceChargeRate: adminSettings.service_charge_rate
      };

      const success = await printReceipt(orderDetails, paymentDetails);
      if (success) {
        // Only show success message if printing actually worked
        Alert.alert('Success', 'Receipt printed successfully');
      }
      // Error alerts are handled inside printReceipt
    } catch (error) {
      console.error('Receipt printing error:', error);
      Alert.alert('Print Error', 'Failed to print receipt. The system will automatically retry.');
    }
  };

  // Function to determine if payment can be completed
  const canCompletePayment = useMemo(() => {
    // If payment method is QR, always allow completion
    if (selectedMethod === "qr") return true;
    
    // For cash payment, check if received amount is sufficient
    if (selectedMethod === "cash") {
      return cashReceived >= total;
    }
    
    // No payment method selected
    return false;
  }, [selectedMethod, cashReceived, total]);

  if (!selectedTable) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Please select a table first</Text>
      </View>
    );
  }

  // Show loading indicator while fetching settings
  if (isLoadingSettings) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading payment settings...</Text>
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
            <Text className="text-gray-500">Table {selectedTable?.table_num}</Text>
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
                ฿{total.toFixed(2)}
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
                        placeholder="฿0.00"
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
                            ฿{amount}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Summary */}
              <View className="mt-2">
                {[{ label: "Subtotal", value: subtotal },
                  { label: `Service Charge (${adminSettings.service_charge_rate}%)`, value: serviceCharge, hideWhenZero: true },
                  { label: `Discount (${discount}%)`, value: -discountAmount, isNegative: true, hideWhenZero: true },
                  { label: `VAT (${adminSettings.vat_rate}%)`, value: vat, hideWhenZero: true },
                ].filter(item => !(item.hideWhenZero && item.value === 0))
                 .map(({ label, value, isNegative }) => (
                  <View key={label} className="flex flex-row justify-between">
                    <Text className="text-gray-600 text-sm">{label}</Text>
                    <Text className={`font-medium text-sm ${isNegative ? "text-red-500" : ""}`}>
                      {isNegative ? "-" : ""}฿{Math.abs(value).toFixed(2)}
                    </Text>
                  </View>
                ))}
                <View className="flex flex-row justify-between pt-1 border-t border-dashed">
                  <Text className="font-bold">Total</Text>
                  <Text className="font-bold text-[#D89F65]">฿{total.toFixed(2)}</Text>
                </View>

                {selectedMethod === "cash" && cashReceived > 0 && (
                  <View className="flex flex-row justify-between pt-1 border-t border-dashed">
                    <Text className={`font-bold ${cashReceived > total ? "text-green-500" : "text-red-500"}`}>
                      Change
                    </Text>
                    <Text className={`${cashReceived > total ? "text-green-500" : "text-red-500"}`}>
                      ฿{Math.abs(cashReceived - total).toFixed(2)}
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
                disabled={disableButton || !canCompletePayment}
                className={`flex-1 p-4 rounded-lg ${
                  disableButton || !canCompletePayment ? "bg-gray-400" : "bg-primary"
                }`}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {selectedMethod === "cash" && cashReceived < total
                    ? "Insufficient Cash"
                    : "Complete"}
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
