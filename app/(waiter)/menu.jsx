import { View, FlatList, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MenuItem from '../../components/MenuItem'
import OrderItem from '../../components/OrderItem'
import icons from '../../constants/icons'
import { tableStore } from '../../hooks/useStore'
import { useSharedStore } from '../../hooks/useSharedStore'
import { router } from 'expo-router'



const Menu = () => {
  const { selectedTable, addOrderToTable, updateOrderNotes } = tableStore();
  const { menu } = useSharedStore();

  const menuItems = menu

  const getCurrentQuantity = (itemTitle) => {
    if (!selectedTable?.orders) return 0;
    const existingOrder = selectedTable.orders.find(order => order.name === itemTitle);
    return existingOrder ? existingOrder.quantity : 0;
  };

  const getItemNotes = (itemTitle, index) => {
    if (!selectedTable?.orders) return '';
    const existingOrder = selectedTable.orders.find(order => order.name === itemTitle);
    return existingOrder?.individualNotes?.[index] || '';
  };

  const handleNotesChange = (itemTitle, index, newNotes) => {
    if (!selectedTable) return;
    updateOrderNotes(selectedTable.number, itemTitle, index, newNotes);
  };

  const handleItemAction = (item, action) => {
    if (!selectedTable) return;

    const order = {
      name: item.menu_item_name, // Changed from item.title
      quantity: action === 'add' ? +1 : -1,
      notes: "",
      price: parseFloat(item.price)
    };
    addOrderToTable(selectedTable.number, order);
  };

  const calculateTotal = () => {
    if (!selectedTable?.orders) return 0;
    return selectedTable.orders.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 flex-row">
        <View className="flex-1">
          <View className="px-6 py-4 bg-white border-b border-gray-200">
            <Text className='text-2xl font-bold'>
              Order for Table {selectedTable?.number}
            </Text>
          </View>
          <FlatList
            data={menuItems}
            renderItem={({ item }) => (
              <MenuItem
                title={item.menu_item_name}
                category={item.category}
                price={item.price}
                image={item.menu_item_image || null}
                description={item.description}
                onChangeQuantity={(action) => handleItemAction(item, action)}
                currentQuantity={getCurrentQuantity(item.menu_item_name)}
                getItemNotes={(index) => getItemNotes(item.menu_item_name, index)}
                onNotesChange={(index, notes) => handleNotesChange(item.menu_item_name, index, notes)}
              />
            )}
            keyExtractor={item => item.menu_item_id.toString()}
            numColumns={3}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            columnWrapperStyle={{ justifyContent: 'space-between', marginHorizontal: 16 }}
          />

        </View>

        <View className='w-[300px] bg-white border-l border-gray-200 flex flex-col fixed right-0 top-0 bottom-0 shadow-lg'>
          <View className='h-[60px] flex justify-center px-5 border-b border-gray-200'>
            <Text className='font-bold text-2xl'>Current Order</Text>
          </View>
          <View className='flex-1'>
            {selectedTable?.orders?.length > 0 ? (
              <FlatList
                data={selectedTable.orders.filter(Boolean)}
                renderItem={({ item }) => (
                  item && <OrderItem
                    order={item}
                    onNotesChange={(index, notes) => handleNotesChange(item.name, index, notes)}
                  />
                )}
                keyExtractor={(item) => item.name}
                contentContainerStyle={{ padding: 16 }}
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
              onPress={() => router.back()}
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
