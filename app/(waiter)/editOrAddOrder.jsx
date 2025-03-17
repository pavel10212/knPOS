import { FlatList, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import MenuItem from "../../components/MenuItem";
import { useLocalSearchParams, router } from "expo-router";
import { tableStore } from "../../hooks/useStore";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useInventoryStore } from "../../hooks/useInventoryData";
import { useSharedStore } from "../../hooks/useSharedStore";
import { useSocketStore } from "../../hooks/useSocket";
import MenuOrderItem from "../../components/menuOrderItem";
import InventoryItem from "../../components/InventoryItem";
import { orderService } from '../../services/orderService';
import { qrService } from '../../services/qrService';
import { useNotificationStore } from "../../hooks/useNotificationStore";

const EditOrAddOrder = () => {
    const { order } = useLocalSearchParams();
    const isEditMode = Boolean(order);
    const selectedTable = tableStore((state) => state.selectedTable);
    const updateTableStatus = tableStore((state) => state.updateTableStatus);
    const [temporaryOrder, setTemporaryOrder] = useState([]);
    const setOrders = useSharedStore((state) => state.setOrders);
    const menu = useSharedStore((state) => state.menu);
    const [disableButton, setDisableButton] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const orders = useSharedStore((state) => state.orders);
    const [activeTab, setActiveTab] = useState('menu');

    const inventory = useSharedStore((state) => state.inventory);

    const handleNotesChange = useCallback((uniqueKey, newNotes) => {
        setTemporaryOrder(prev =>
            prev.map(item =>
                item.uniqueKey === uniqueKey ? { ...item, request: newNotes } : item
            )
        );
    }, []);

    const existingOrder = useMemo(() => {
        if (!isEditMode || !order) return null;
        const numericOrderId = parseInt(order, 10);
        return orders.find((order) => order.order_id === numericOrderId);
    }, [order, isEditMode]);

    const total = useMemo(
        () =>
            temporaryOrder.reduce((acc, item) => acc + item.price * item.quantity, 0),
        [temporaryOrder]
    );

    const handleItemAction = useCallback((item, action, uniqueKey = null) => {
        setTemporaryOrder((prevOrder) => {
            if (action === "add") {
                const newItem = {
                    id: item.menu_item_id,
                    type: 'menu',
                    uniqueKey: `${item.menu_item_id}-${Date.now()}-${Math.random()}`,
                    name: item.menu_item_name,
                    price: item.price,
                    request: "",
                    quantity: 1,
                };
                return [...prevOrder, newItem];
            } else if (action === "remove") {
                if (uniqueKey) {
                    return prevOrder.filter((i) => i.uniqueKey !== uniqueKey);
                } else {
                    const itemsOfType = prevOrder.filter((i) => i.id === item.menu_item_id);
                    if (itemsOfType.length === 0) return prevOrder;
                    const lastItem = itemsOfType[itemsOfType.length - 1];
                    return prevOrder.filter((i) => i.uniqueKey !== lastItem.uniqueKey);
                }
            }
            return prevOrder;
        });
    }, []);


    const handleInventoryAction = useCallback((item, action, uniqueKey = null) => {
        setTemporaryOrder((prevOrder) => {
            if (action === "add") {
                // Find the inventory item to check current stock
                const inventoryItem = inventory.find(i => i.inventory_item_id === item.inventory_item_id);
                if (!inventoryItem || inventoryItem.quantity <= 0) {
                    return prevOrder;
                }

                // Find existing inventory item in order
                const existingItem = prevOrder.find(
                    i => i.id === item.inventory_item_id && i.type === 'inventory'
                );

                if (existingItem) {
                    // Check if adding another would exceed available quantity
                    if (existingItem.quantity >= inventoryItem.quantity) {
                        return prevOrder;
                    }
                    // Update quantity of existing item
                    return prevOrder.map(i =>
                        i.uniqueKey === existingItem.uniqueKey
                            ? { ...i, quantity: i.quantity + 1 }
                            : i
                    );
                }

                // Add new inventory item
                const newItem = {
                    id: item.inventory_item_id,
                    uniqueKey: `${item.inventory_item_id}-${Date.now()}`,
                    name: item.inventory_item_name,
                    price: item.cost_per_unit,
                    quantity: 1,
                    type: 'inventory'
                };
                return [...prevOrder, newItem];
            } else if (action === "remove") {
                const itemToUpdate = prevOrder.find(i =>
                    i.type === 'inventory' &&
                    (uniqueKey ? i.uniqueKey === uniqueKey : i.id === item.inventory_item_id)
                );

                if (!itemToUpdate) return prevOrder;

                if (itemToUpdate.quantity > 1) {
                    return prevOrder.map(i =>
                        i.uniqueKey === itemToUpdate.uniqueKey
                            ? { ...i, quantity: i.quantity - 1 }
                            : i
                    );
                }

                return prevOrder.filter(i => i.uniqueKey !== itemToUpdate.uniqueKey);
            }
            return prevOrder;
        });
    }, [inventory]);

    useEffect(() => {
        if (existingOrder) {
            const orderDetails =
                typeof existingOrder.order_details === "string"
                    ? JSON.parse(existingOrder.order_details)
                    : existingOrder.order_details;

            const initialOrder = orderDetails.flatMap((detail) => {
                const isInventory = detail.type === "inventory";

                if (isInventory) {
                    const itemDetails = inventory?.find(
                        (inv) => inv.inventory_item_id === detail.inventory_item_id
                    );
                    return [{
                        id: detail.inventory_item_id,
                        uniqueKey: detail.cartItemId,
                        name: itemDetails?.inventory_item_name || `Unknown item ${detail.inventory_item_id}`,
                        price: itemDetails?.cost_per_unit || 0,
                        quantity: detail.quantity,
                        type: 'inventory'
                    }];
                } else {
                    // Handle menu items as before (creating individual entries)
                    return Array(detail.quantity).fill().map((_, i) => {
                        const itemDetails = menu?.find(
                            (mi) => mi.menu_item_id === detail.menu_item_id
                        );
                        return {
                            id: detail.menu_item_id,
                            uniqueKey: detail.cartItemId,
                            name: itemDetails?.menu_item_name || `Unknown item ${detail.menu_item_id}`,
                            price: itemDetails?.price || 0,
                            quantity: 1,
                            request: detail.request || "",
                            type: 'menu'
                        };
                    });
                }
            });
            setTemporaryOrder(initialOrder);
        } else {
            setTemporaryOrder([]);
        }
    }, [order, menu, inventory, existingOrder]);

    const handleFinishOrder = useCallback(async () => {
        try {
            console.log("Starting order submission process...");
            console.log("Current button state:", disableButton ? "Disabled" : "Enabled");

            setDisableButton(true);
            setIsSubmitting(true);

            if (!selectedTable) {
                console.log("No table selected, aborting order submission");
                setDisableButton(false);
                setIsSubmitting(false);
                return;
            }

            if (!temporaryOrder.length) {
                console.log("No items in order, aborting order submission");
                setDisableButton(false);
                setIsSubmitting(false);
                return;
            }

            // Check if table is Available and update status
            if (!isEditMode && selectedTable.status === "Available") {
                console.log(`Table status is Available, generating token for table ${selectedTable.table_num}`);
                await qrService.generateToken(selectedTable.table_num);
                await updateTableStatus(selectedTable.table_num, "Unavailable");
            }

            console.log("Preparing order details...");
            const orderDetails = {
                order_id: isEditMode ? order : null,
                table_num: selectedTable.table_num,
                order_status: "Pending",
                total_amount: total,
                order_date_time: new Date().toISOString(),
                completion_date_time: null,
                order_details: JSON.stringify(
                    temporaryOrder.map((item) => ({
                        [item.type === 'inventory' ? 'inventory_item_id' : 'menu_item_id']: item.id,
                        type: item.type || 'menu',
                        cartItemId: Math.random().toString(36).substring(2, 9),
                        status: "pending",
                        quantity: item.quantity,
                        request: item.request || "",
                    }))
                ),
            };

            console.log("Submitting order to service...");
            // Store the result of the API call
            const savedOrder = await (isEditMode
                ? orderService.updateOrder(order, {
                    order_status: "Pending",
                    completion_date_time: null,
                    total_amount: total,
                    order_details: orderDetails.order_details,
                })
                : orderService.createOrder(orderDetails));

            console.log("Order saved successfully:", savedOrder);

            // Safe access of order_id with proper error handling
            const newOrderId = Array.isArray(savedOrder) && savedOrder.length > 0 ?
                savedOrder[0].order_id :
                (savedOrder && savedOrder.order_id ? savedOrder.order_id : parseInt(order, 10));

            // Emit socket events to notify other clients
            if (isEditMode) {
                useSocketStore.getState().emitLocalOrderUpdated(parseInt(order, 10));
            } else if (newOrderId) {
                useSocketStore.getState().emitLocalOrderProcessed(newOrderId);
            }

            // Update local state
            let updatedOrders;
            if (isEditMode) {
                // For update, handle both array or single object response
                const updatedOrder = Array.isArray(savedOrder) ? savedOrder[0] : savedOrder;
                updatedOrders = orders.map(o => o.order_id === newOrderId ? updatedOrder : o);
            } else {
                // For create, add the new order to the list
                const newOrder = Array.isArray(savedOrder) ? savedOrder[0] : savedOrder;
                updatedOrders = [...orders, newOrder];
            }

            setOrders(updatedOrders);
            useInventoryStore.getState().fetchInventory();
            setTemporaryOrder([]);

            console.log("Order completed successfully, navigating to home");
            router.push("home");

            useNotificationStore.getState().addNotification({
                type: "success",
                text1: isEditMode ? "Order Updated" : "Order Created",
                text2: isEditMode ?
                    `Order #${newOrderId} has been updated` :
                    `Order #${newOrderId} has been created`,
            });

        } catch (error) {
            console.error("Error handling order:", error);
            useNotificationStore.getState().addNotification({
                type: "error",
                text1: "Error",
                text2: `Failed to ${isEditMode ? 'update' : 'create'} order. Please try again.`,
            });
        } finally {
            // Always ensure the button is re-enabled, even if there's an error or success
            console.log("Resetting button state to enabled");
            setDisableButton(false);
            setIsSubmitting(false);
        }
    }, [isEditMode, order, selectedTable, temporaryOrder, updateTableStatus, total, setOrders]);

    const renderMenuItem = useMemo(
        () =>
            ({ item }) =>
            (
                <MenuItem
                    key={`menu-item-${item?.menu_item_id}`}
                    title={item.menu_item_name}
                    price={item.price}
                    image={item.menu_item_image || "/assets/images/favicon.png"}
                    request={item.request}
                    currentQuantity={
                        temporaryOrder.filter((o) => o.id === item.menu_item_id).length || 0
                    }

                    description={item.description}
                    onChangeQuantity={(action) => handleItemAction(item, action)}
                />
            ),
        [temporaryOrder, handleItemAction]
    );

    const renderInventoryItem = useMemo(
        () =>
            ({ item }) => (
                <InventoryItem
                    key={`inventory-item-${item.inventory_item_id}`}
                    title={item.inventory_item_name}
                    quantity={item.quantity}
                    unit={item.cost_per_unit}
                    currentQuantity={
                        temporaryOrder.find(
                            (o) => o.id === item.inventory_item_id && o.type === 'inventory'
                        )?.quantity || 0
                    }
                    onChangeQuantity={(action) => handleInventoryAction(item, action)}
                    isEditMode={true}
                    disabled={item.quantity <= 0}
                />
            ),
        [temporaryOrder, handleInventoryAction]
    );

    const menuKeyExtractor = useCallback((item) =>
        `menu-${item?.menu_item_id || Math.random()}`,
        []);

    const inventoryKeyExtractor = useCallback((item) =>
        `inventory-${item?.inventory_item_id || Math.random()}`,
        []);

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
                        <Text className="text-2xl font-bold ml-8 mb-4">
                            {isEditMode
                                ? `Edit Order #${order} - Table ${selectedTable?.table_num}`
                                : `New Order - Table ${selectedTable?.table_num}`}
                        </Text>
                        <View className="flex-row">
                            <TouchableOpacity
                                onPress={() => setActiveTab('menu')}
                                className={`px-4 py-2 mr-2 rounded-t-lg ${activeTab === 'menu' ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                                <Text
                                    className={activeTab === 'menu' ? 'text-white font-bold' : 'text-gray-600'}>Menu</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setActiveTab('inventory')}
                                className={`px-4 py-2 rounded-t-lg ${activeTab === 'inventory' ? 'bg-primary' : 'bg-gray-200'}`}
                            >
                                <Text
                                    className={activeTab === 'inventory' ? 'text-white font-bold' : 'text-gray-600'}>Beverages</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ display: activeTab === 'menu' ? 'flex' : 'none', flex: 1 }}>
                        <FlatList
                            key="menuList"
                            data={menu}
                            renderItem={renderMenuItem}
                            keyExtractor={menuKeyExtractor}
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

                    <View style={{ display: activeTab === 'inventory' ? 'flex' : 'none', flex: 1 }}>
                        <FlatList
                            key="inventoryList"
                            data={inventory}
                            renderItem={renderInventoryItem}
                            keyExtractor={inventoryKeyExtractor}
                            initialNumToRender={9}
                            maxToRenderPerBatch={6}
                            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                        />
                    </View>
                </View>

                <View
                    className="w-[300px] bg-white border-l border-gray-200 flex flex-col fixed right-0 top-0 bottom-0 shadow-lg">
                    <View className="h-[60px] flex justify-center px-5 border-b border-gray-200">
                        <Text className="font-bold text-2xl">
                            {isEditMode ? "Edit Order" : "Current Order"}
                        </Text>
                    </View>
                    <View className="flex-1">
                        {temporaryOrder?.length > 0 ? (
                            <FlatList
                                data={temporaryOrder}
                                removeClippedSubviews={false}
                                renderItem={({ item }) => (
                                    <MenuOrderItem
                                        order={item}
                                        quantity={item.quantity}
                                        onDecrease={(id) =>
                                            item.type === 'inventory'
                                                ? handleInventoryAction({ inventory_item_id: id, ...item }, "remove")
                                                : handleItemAction({ menu_item_id: id, ...item }, "remove")
                                        }
                                        onIncrease={(id) =>
                                            item.type === 'inventory' &&
                                            handleInventoryAction({ inventory_item_id: id, ...item }, "add")
                                        }
                                        handleNotesChange={handleNotesChange}
                                    />
                                )}
                                keyExtractor={(item) => `${item.type || 'menu'}-${item.id}-${Math.random()}`}
                            />
                        ) : (
                            <Text className="p-4 text-gray-500">No items in order</Text>
                        )}
                    </View>
                    <View className="p-5 border-t border-gray-200 bg-white">
                        <Text className="text-xl font-bold mb-4">
                            Total: ฿{total.toFixed(2)}
                        </Text>
                        <TouchableOpacity
                            className={`bg-primary p-4 rounded-lg ${disableButton ? 'opacity-70' : ''}`}
                            disabled={disableButton}
                            onPress={() => handleFinishOrder()}
                        >
                            {isSubmitting ? (
                                <View className="flex-row items-center justify-center">
                                    <ActivityIndicator size="small" color="white" />
                                    <Text className="text-white text-center font-bold text-lg ml-2">
                                        {isEditMode ? "Updating..." : "Processing..."}
                                    </Text>
                                </View>
                            ) : (
                                <Text className="text-white text-center font-bold text-lg">
                                    {isEditMode ? "Update Order" : "Confirm Order"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default EditOrAddOrder;
