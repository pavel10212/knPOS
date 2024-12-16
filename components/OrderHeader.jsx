import { View, Text, Image } from 'react-native';
import React from 'react';
import icons from '../constants/icons';

const OrderHeader = ({ selectedTable }) => (
    <View className='h-[60px] flex justify-center border-hairline'>
        <Text className='font-bold ml-5 text-2xl'>Order #</Text>
        <View className='ml-5 flex flex-row'>
            <Image source={icons.table} className='w-6 h-6' />
            <Text className='ml-1 font-semibold'>
                Table: {selectedTable?.table_num}
            </Text>
        </View>
    </View>
);

export default OrderHeader;
