import { View, FlatList } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import MenuItem from '../../components/MenuItem'
import icons from '../../constants/icons'

const Menu = () => {
  const menuItems = [
    { id: 1, title: 'Grilled Chicken', category: 'Meat', price: '15.99', image: icons.menu },
    { id: 2, title: 'Caesar Salad', category: 'Salads', price: '12.99', image: icons.menu },
    { id: 3, title: 'Margherita Pizza', category: 'Pizza', price: '18.99', image: icons.menu },
    { id: 4, title: 'Sushi Roll', category: 'Seafood', price: '22.99', image: icons.menu },
    { id: 5, title: 'Beef Burger', category: 'Burgers', price: '16.99', image: icons.menu },
    { id: 6, title: 'Pasta Carbonara', category: 'Pasta', price: '17.99', image: icons.menu },
    { id: 7, title: 'Greek Salad', category: 'Salads', price: '13.99', image: icons.menu },
    { id: 8, title: 'Fish Tacos', category: 'Seafood', price: '14.99', image: icons.menu },
  ];

  return (
    <SafeAreaView className="flex-1">
      <FlatList
        data={menuItems}
        renderItem={({ item }) => (
          <MenuItem
            title={item.title}
            category={item.category}
            price={item.price}
            image={item.image}
          />
        )}
        keyExtractor={item => item.id.toString()}
        numColumns={4}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          marginHorizontal: 10
        }}
        contentContainerStyle={{
          paddingHorizontal: 5,
          paddingVertical: 10
        }}
      />
    </SafeAreaView>
  )
}

export default Menu