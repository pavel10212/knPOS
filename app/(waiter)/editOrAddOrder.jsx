import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MenuItem from "../../components/MenuItem";
import { useLocalSearchParams, router } from "expo-router";
import { tableStore } from "../../hooks/useStore";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSharedStore } from "../../hooks/useSharedStore";
import { useSocketStore } from "../../hooks/useSocket";
import { localStore } from "../../hooks/Storage/cache";
import MenuOrderItem from "../../components/menuOrderItem";

const EditOrAddOrder = () => {
  const { order } = useLocalSearchParams();
  const isEditMode = Boolean(order);
  const selectedTable = tableStore((state) => state.selectedTable);
  const updateTableStatus = tableStore((state) => state.updateTableStatus);
  const [temporaryOrder, setTemporaryOrder] = useState([]);
  const updateOrderNotes = tableStore((state) => state.updateOrderNotes);
  const setOrders = useSharedStore((state) => state.setOrders);
  const menu = useSharedStore((state) => state.menu);
  const orders = useSharedStore((state) => state.orders);

  const handleNotesChange = (itemTitle, index, newNotes) => {
    if (!selectedTable) return;
    updateOrderNotes(selectedTable.number, itemTitle, index, newNotes);
  };

  const existingOrder = useMemo(() => {
    if (!isEditMode || !order) return null;
    const numericOrderId = parseInt(order, 10);
    return orders.find((order) => order.order_id === numericOrderId);
  }, [order, orders, isEditMode]);

  const total = useMemo(
    () =>
      temporaryOrder.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [temporaryOrder]
  );

  const handleItemAction = useCallback((item, action) => {
    setTemporaryOrder((prevOrder) => {
      const existingItem = prevOrder.find((o) => o.id === item.menu_item_id);
      const quantity = action === "add" ? 1 : -1;

      if (!existingItem && quantity > 0) {
        return [
          ...prevOrder,
          {
            id: item.menu_item_id,
            name: item.menu_item_name,
            price: item.price,
            quantity,
          },
        ];
      }

      return prevOrder.reduce((acc, curr) => {
        if (curr.id !== item.menu_item_id) return [...acc, curr];
        const newQuantity = curr.quantity + quantity;
        return newQuantity > 0
          ? [...acc, { ...curr, quantity: newQuantity }]
          : acc;
      }, []);
    });
  }, []);

  useEffect(() => {
    if (existingOrder) {
      const orderDetails =
        typeof existingOrder.order_details === "string"
          ? JSON.parse(existingOrder.order_details)
          : existingOrder.order_details;

      const initialOrder = orderDetails.map((detail) => {
        const menuItem = menu.menuItems.find(
          (mi) => mi.menu_item_id === detail.menu_item_id
        );
        return {
          id: detail.menu_item_id,
          name:
            menuItem?.menu_item_name || `Unknown item ${detail.menu_item_id}`,
          price: menuItem?.price || 0,
          quantity: detail.quantity,
          request: detail.request || "",
        };
      });
      setTemporaryOrder(initialOrder);
    } else {
      setTemporaryOrder([]);
    }
  }, [order, menu.menuItems, existingOrder]);

  const handleFinishOrder = useCallback(async () => {
    if (!selectedTable || !temporaryOrder.length) return;

    // Check if table is Available and update status
    if (!isEditMode && selectedTable.status === "Available") {
      await updateTableStatus(selectedTable.table_num, "Unavailable");
    }

    const orderDetails = {
      order_id: isEditMode ? order : null,
      table_num: selectedTable.table_num,
      order_status: "Pending",
      total_amount: total,
      order_date_time: new Date().toISOString(),
      completion_date_time: null,
      order_details: JSON.stringify(
        temporaryOrder.map((item) => ({
          menu_item_id: item.id,
          status: "pending",
          quantity: item.quantity,
          request: item.request || "",
        }))
      ),
      deviceId: useSocketStore.getState().deviceId,
    };

    try {
      const endpoint = isEditMode ? "orders-update" : "orders-insert";
      const method = isEditMode ? "PUT" : "POST";
      const body = isEditMode
        ? {
            order_id: order,
            order_status: "Pending",
            completion_date_time: null,
            total_amount: total,
            order_details: orderDetails.order_details,
          }
        : orderDetails;

      console.log("Sending order to server:", body);
      console.log("Endpoint:", endpoint);
      console.log("Method:", method);

      const response = await fetch(
        `http://${process.env.EXPO_PUBLIC_IP}:3000/${endpoint}`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      console.log("Didn't throw error");

      if (!response.ok)
        throw new Error(`Failed to ${isEditMode ? "update" : "place"} order`);

      const serverData = await response.json();
      console.log("Server data:", serverData);
      const savedOrder = Array.isArray(serverData) ? serverData[0] : serverData;

      // Track this order as processed
      useSocketStore.getState().trackProcessedOrder(savedOrder.order_id);

      const cachedOrders = JSON.parse(localStore.getString("orders") || "[]");
      console.log("Cached orders:", cachedOrders);
      const updatedOrders = isEditMode
        ? [
            ...cachedOrders.filter((o) => o.order_id !== savedOrder.order_id),
            savedOrder,
          ]
        : [...cachedOrders, savedOrder];

      localStore.set("orders", JSON.stringify(updatedOrders));

      setOrders(updatedOrders);

      console.log("Order saved successfully");
      setTemporaryOrder([]);
      router.push("home");
    } catch (error) {
      console.error("Error handling order:", error.message);
    }
  }, [isEditMode, order, selectedTable, temporaryOrder, orders]);

  const renderMenuItem = useMemo(
    () =>
      ({ item }) =>
        (
          <MenuItem
            key={`menu-item-${item.menu_item_id}`}
            title={item.menu_item_name}
            category={item.category}
            price={item.price}
            image={item.menu_item_image || "/assets/images/favicon.png"}
            request={item.request}
            currentQuantity={
              temporaryOrder.find((o) => o.id === item.menu_item_id)
                ?.quantity || 0
            }
            description={item.description}
            onChangeQuantity={(action) => handleItemAction(item, action)}
            onNotesChange={(index, notes) =>
              handleNotesChange(item.menu_item_name, index, notes)
            }
          />
        ),
    [temporaryOrder, handleItemAction, handleNotesChange]
  );

  const keyExtractor = useCallback((item) => item.menu_item_id.toString(), []);
  const getItemLayout = useCallback(
    (_, index) => ({
      length: 200,
      offset: 200 * index,
      index,
    }),
    []
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Add Back Button */}
      <TouchableOpacity
        className="absolute top-4 left-4 z-10"
        onPress={() => router.back()}
      >
        <Text className="text-3xl">&lt;</Text>
      </TouchableOpacity>

      <View className="flex-1 flex-row">
        <View className="flex-1">
          <View className="px-6 py-4 bg-white border-b border-gray-200">
            <Text className="text-2xl font-bold ml-8">
              {isEditMode
                ? `Edit Order #${order} - Table ${selectedTable?.table_num}`
                : `New Order - Table ${selectedTable?.table_num}`}
            </Text>
          </View>
          <FlatList
            data={menu.menuItems}
            renderItem={renderMenuItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            initialNumToRender={9}
            maxToRenderPerBatch={6}
            windowSize={5}
            numColumns={3}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginHorizontal: 16,
            }}
          />
        </View>

        <View className="w-[300px] bg-white border-l border-gray-200 flex flex-col fixed right-0 top-0 bottom-0 shadow-lg">
          <View className="h-[60px] flex justify-center px-5 border-b border-gray-200">
            <Text className="font-bold text-2xl">
              {isEditMode ? "Edit Order" : "Current Order"}
            </Text>
          </View>
          <View className="flex-1">
            {temporaryOrder ? (
              <FlatList
                data={temporaryOrder}
                renderItem={({ item }) => (
                  <MenuOrderItem
                    order={item}
                    onIncrease={(id) =>
                      handleItemAction({ ...item, menu_item_id: id }, "add")
                    }
                    onDecrease={(id) =>
                      handleItemAction({ ...item, menu_item_id: id }, "remove")
                    }
                  />
                )}
                keyExtractor={(item) => item.id.toString() + Math.random()}
              />
            ) : (
              <Text className="p-4 text-gray-500">No items in order</Text>
            )}
          </View>
          <View className="p-5 border-t border-gray-200 bg-white">
            <Text className="text-xl font-bold mb-4">
              Total: ${total.toFixed(2)}
            </Text>
            <TouchableOpacity
              className="bg-primary p-4 rounded-lg"
              onPress={() => handleFinishOrder()}
            >
              <Text className="text-white text-center font-bold text-lg">
                {isEditMode ? "Update Order" : "Confirm Order"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EditOrAddOrder;
