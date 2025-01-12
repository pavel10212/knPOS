import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';

const PayItem = ({ item, addItem, subtractItem, deleteItem }) => {
    const subtotal = item.price * item.quantity;

    return (
        <View className='flex flex-row justify-between items-center p-4 border-b border-gray-100'>
            <Text className='w-[30%] font-medium'>{item.name}</Text>
            <Text className='w-[15%] text-center'>${item.price.toFixed(2)}</Text>
            <View className='w-[25%] flex-row justify-center items-center space-x-2'>
                <TouchableOpacity onPress={() => subtractItem(item)}>
                    <MaterialIcons name="remove-circle-outline" size={24} color="#666" />
                </TouchableOpacity>
                <Text className='text-center w-8'>{item.quantity}</Text>
                <TouchableOpacity onPress={() => addItem(item)}>
                    <MaterialIcons name="add-circle-outline" size={24} color="#666" />
                </TouchableOpacity>
            </View>
            <Text className='w-[15%] text-right'>${subtotal.toFixed(2)}</Text>
            <View className='w-[15%] flex items-center'>
                <TouchableOpacity onPress={() => deleteItem(item)}>
                    <MaterialIcons name="delete-outline" size={24} color="red" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default PayItem;
