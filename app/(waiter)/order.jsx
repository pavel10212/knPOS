import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import TableOrders from '../../components/TableOrders'

const Order = () => {
  const tables = [
    {
      id: 1,
      name: 'Table 1',
      orders: [
        {
          id: 1,
          status: 'preparing',
          items: [
            {
              name: 'Chicken Alfredo',
              quantity: 2,
              price: 12.99,
              notes: 'No mushrooms',
              status: 'preparing'
            },
            {
              name: 'Cheese Pizza',
              quantity: 1,
              price: 9.99,
              notes: 'Extra cheese',
              status: 'pending'
            }
          ]
        },
        {
          id: 2,
          status: 'ready',
          items: [
            {
              name: 'Spaghetti',
              quantity: 1,
              price: 10.99,
              notes: '',
              status: 'ready'
            }
          ]
        }
      ]
    },
    {
      id: 2,
      name: 'Table 2',
      orders: [
        {
          id: 3,
          status: 'pending',
          items: [
            {
              name: 'Spaghetti',
              quantity: 2,
              price: 10.99,
              notes: 'No meatballs',
              status: 'pending'
            }
          ]
        },
        {
          id: 4,
          status: 'pending',
          items: [
            {
              name: 'Pepperoni Pizza',
              quantity: 1,
              price: 8.99,
              notes: 'Extra pepperoni',
              status: 'pending'
            }
          ]
        }
      ]
    },
    {
      id: 3,
      name: 'Table 3',
      orders: [
        {
          id: 5,
          status: 'preparing',
          items: [
            {
              name: 'Fish & Chips',
              quantity: 1,
              price: 15.99,
              notes: 'Extra tartar sauce',
              status: 'preparing'
            }
          ]
        }
      ]
    },
    {
      id: 4,
      name: 'Table 4',
      orders: [
        {
          id: 6,
          status: 'ready',
          items: [
            {
              name: 'Steak',
              quantity: 2,
              price: 25.99,
              notes: 'Medium rare',
              status: 'ready'
            },
            {
              name: 'Caesar Salad',
              quantity: 2,
              price: 8.99,
              notes: 'No croutons',
              status: 'ready'
            }
          ]
        }
      ]
    },
    {
      id: 5,
      name: 'Table 5',
      orders: [
        {
          id: 7,
          status: 'pending',
          items: [
            {
              name: 'Pasta Carbonara',
              quantity: 1,
              price: 14.99,
              notes: 'Extra cheese',
              status: 'pending'
            }
          ]
        }
      ]
    },
    {
      id: 6,
      name: 'Table 6',
      orders: [
        {
          id: 8,
          status: 'preparing',
          items: [
            {
              name: 'Margherita Pizza',
              quantity: 1,
              price: 12.99,
              notes: 'Well done',
              status: 'preparing'
            }
          ]
        }
      ]
    },
    {
      id: 7,
      name: 'Table 7',
      orders: [
        {
          id: 9,
          status: 'ready',
          items: [
            {
              name: 'Greek Salad',
              quantity: 1,
              price: 10.99,
              notes: '',
              status: 'ready'
            }
          ]
        }
      ]
    },
    {
      id: 8,
      name: 'Table 8',
      orders: [
        {
          id: 10,
          status: 'pending',
          items: [
            {
              name: 'Chicken Curry',
              quantity: 1,
              price: 13.99,
              notes: 'Spicy',
              status: 'pending'
            }
          ]
        }
      ]
    }
  ]

  return (
    <View className="flex-1 bg-[#F3F4F6]">
      <ScrollView>
        <View className="p-4 flex-row flex-wrap">
          {tables.map(table => (
            <TableOrders key={table.id} table={table} />
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

export default Order