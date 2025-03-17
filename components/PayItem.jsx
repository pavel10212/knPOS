import { Text, View } from 'react-native';
import React from 'react';

const PayItem = ({ item }) => {
    const subtotal = item.price * item.quantity;

    return (
        <View className='flex flex-row justify-between items-center py-4 px-4 border-b border-gray-100'>
            <Text className='w-[40%] font-medium'>{item.name}</Text>
            <Text className='w-[20%] text-center'>฿{item.price}</Text>
            <Text className='w-[20%] text-center'>{item.quantity}</Text>
            <Text className='w-[20%] text-right'>฿{subtotal.toFixed(2)}</Text>
        </View>
    );
};

export default PayItem;
