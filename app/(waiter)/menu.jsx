import {FlatList, Text, TouchableOpacity, View} from 'react-native'
import {useEffect, useState} from "react";
import {SafeAreaView} from 'react-native-safe-area-context'
import MenuItem from '../../components/MenuItem'
import {tableStore} from '../../hooks/useStore'
import {useSharedStore} from '../../hooks/useSharedStore'
import {router} from 'expo-router'
import MenuOrderItem from "../../components/menuOrderItem";
import {localStore} from "../../hooks/Storage/cache";


const Menu = () => {
    const selectedTable = tableStore((state) => state.selectedTable)
    const updateOrderNotes = tableStore((state) => state.updateOrderNotes)
    const menu = useSharedStore((state) => state.menu)
    const [temporaryOrder, setTemporaryOrder] = useState([])
    const [total, setTotal] = useState(0)
    const setOrders = useSharedStore((state) => state.setOrders)

    const handleNotesChange = (itemTitle, index, newNotes) => {
        if (!selectedTable) return;
        updateOrderNotes(selectedTable.number, itemTitle, index, newNotes);
    };

    const handleItemAction = (item, action) => {
        const order = {
            id: item.menu_item_id,
            name: item.menu_item_name,
            price: item.price,
            quantity: action === 'add' ? 1 : -1,
        };

        const existingOrder = temporaryOrder.find((o) => o.id === order.id);
        if (existingOrder) {
            existingOrder.quantity += order.quantity;
            if (existingOrder.quantity <= 0) {
                setTemporaryOrder(temporaryOrder.filter((o) => o.id !== order.id));
            } else {
                setTemporaryOrder([...temporaryOrder]);
            }
        } else {
            setTemporaryOrder([...temporaryOrder, order]);
        }

        return order.quantity;
    };


    const calculateTotal = () => {
        return temporaryOrder.reduce((acc, item) => {
            return acc + item.price * item.quantity;
        }, 0);
    };

    useEffect(() => {
        setTotal(calculateTotal());
    }, [temporaryOrder]);


    const handleFinishOrder = async () => {
        const orderDetails = {
            table_num: selectedTable.table_num,
            order_status: 'Pending',
            total_amount: total,
            order_date_time: new Date().toISOString(),
            completion_date_time: null,
            order_details: JSON.stringify(temporaryOrder.map((item) => ({
                menu_item_id: item.id,
                status: 'pending',
                quantity: item.quantity,
            }))),
        };

        try {
            const response = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:3000/orders-insert`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderDetails),
            });

            if (!response.ok) {
                throw new Error("Failed to place order");
            }

            const serverData = await response.json();

            const savedOrder = Array.isArray(serverData) ? serverData[0] : serverData;
            console.log("Saved Order from server:", savedOrder);

            const cachedOrders = localStore.getString("orders");
            const parsedOrders = cachedOrders ? JSON.parse(cachedOrders) : [];

            const updatedOrders = [...parsedOrders, savedOrder];
            localStore.set("orders", JSON.stringify(updatedOrders));

            setOrders(updatedOrders);

            setTemporaryOrder([]);

            router.push("home");
        } catch (error) {
            console.error("Error placing order:", error.message);
        }
    };


    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-1 flex-row">
                <View className="flex-1">
                    <View className="px-6 py-4 bg-white border-b border-gray-200">
                        <Text className='text-2xl font-bold'>
                            Order for Table {selectedTable?.table_num}
                        </Text>
                    </View>
                    <FlatList
                        data={menu.menuItems}
                        renderItem={({item}) => (
                            <MenuItem
                                title={item.menu_item_name}
                                category={item.category}
                                price={item.price}
                                image={item.menu_item_image || '/assets/images/favicon.png'}
                                currentQuantity={temporaryOrder.find((o) => o.id === item.menu_item_id)?.quantity || 0}
                                description={item.description}
                                onChangeQuantity={(action) => handleItemAction(item, action)}
                                onNotesChange={(index, notes) => handleNotesChange(item.menu_item_name, index, notes)}
                            />
                        )}
                        keyExtractor={item => item.menu_item_id.toString()}
                        numColumns={3}
                        contentContainerStyle={{padding: 16, paddingBottom: 100}}
                        columnWrapperStyle={{justifyContent: 'space-between', marginHorizontal: 16}}
                    />

                </View>

                <View
                    className='w-[300px] bg-white border-l border-gray-200 flex flex-col fixed right-0 top-0 bottom-0 shadow-lg'>
                    <View className='h-[60px] flex justify-center px-5 border-b border-gray-200'>
                        <Text className='font-bold text-2xl'>Current Order</Text>
                    </View>
                    <View className='flex-1'>
                        {temporaryOrder ? (
                            <FlatList
                                data={temporaryOrder}
                                renderItem={({item}) => (
                                    <MenuOrderItem
                                        order={item}
                                        onIncrease={(id) => handleItemAction({...item, menu_item_id: id}, 'add')}
                                        onDecrease={(id) => handleItemAction({...item, menu_item_id: id}, 'remove')}
                                    />
                                )}
                                keyExtractor={(item) => item.id.toString()}
                            />


                        ) : (
                            <Text className='p-4 text-gray-500'>No items in order</Text>
                        )}
                    </View>
                    <View className='p-5 border-t border-gray-200 bg-white'>
                        <Text className='text-xl font-bold mb-4'>
                            Total: ${calculateTotal().toFixed(2)}
                        </Text>
                        <TouchableOpacity
                            className='bg-primary p-4 rounded-lg'
                            onPress={() => handleFinishOrder()}
                        >
                            <Text className='text-white text-center font-bold text-lg'>
                                Confirm Order
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    )
}

export default Menu
