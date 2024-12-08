import { View, FlatList, Text, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MenuItem from '../../components/MenuItem'
import OrderItem from '../../components/OrderItem'
import icons from '../../constants/icons'
import { tableStore } from '../../hooks/useStore'
import { router } from 'expo-router'

const menuItems = [
  {
    id: 1,
    title: 'Chicken Wings',
    category: 'Appetizers',
    price: '15.99',
    image: icons.menu
  },
  {
    id: 2,
    title: 'Caesar Salad',
    category: 'Salads',
    price: '12.99',
    image: icons.menu
  },
  {
    id: 3,
    title: 'Beef Burger',
    category: 'Main Course',
    price: '16.99',
    image: icons.menu
  },
  {
    id: 4,
    title: 'Pasta Carbonara',
    category: 'Main Course',
    price: '17.99',
    image: icons.menu
  },
  {
    id: 5,
    title: 'Margherita Pizza',
    category: 'Pizza',
    price: '18.99',
    image: icons.menu
  },
  {
    id: 6,
    title: 'Fish & Chips',
    category: 'Main Course',
    price: '19.99',
    image: icons.menu
  },
  {
    id: 7,
    title: 'Greek Salad',
    category: 'Salads',
    price: '13.99',
    image: icons.menu
  },
  {
    id: 8,
    title: 'Chocolate Cake',
    category: 'Desserts',
    price: '8.99',
    image: icons.menu
  }
];

const Menu = () => {
  const { selectedTable, addOrderToTable, updateOrderNotes } = tableStore();

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
      name: item.title,
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
                title={item.title}
                category={item.category}
                price={item.price}
                image={item.image}
                onChangeQuantity={(action) => handleItemAction(item, action)}
                currentQuantity={getCurrentQuantity(item.title)}
                getItemNotes={(index) => getItemNotes(item.title, index)}
                onNotesChange={(index, notes) => handleNotesChange(item.title, index, notes)}
              />
            )}
            keyExtractor={item => item.id.toString()}
            numColumns={3}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 100,
            }}
            columnWrapperStyle={{
              justifyContent: 'space-between',
              marginHorizontal: 16,
              width: '100%',
            }}
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
