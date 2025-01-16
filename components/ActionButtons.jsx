import { View, Text, TouchableOpacity } from 'react-native';
import React from 'react';
import { router } from 'expo-router';

const ActionButtons = ({ onPrintQR, order }) => (
    <View className='h-[140px] m-4 gap-2'>
        <View className='flex flex-row h-[65px] gap-2'>
            <TouchableOpacity
                className='bg-primary flex-1 flex rounded-lg justify-center items-center'
                onPress={() => router.push('/menu')}
            >
                <Text className='text-white font-bold text-lg'>Add To Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
                className='bg-[#64D393] rounded-lg flex-1 flex justify-center items-center'
                onPress={router.push('/payment')}>
                <Text className='text-white font-bold text-lg'>Pay</Text>
            </TouchableOpacity>
        </View>
        <TouchableOpacity
            className='bg-[#A9A9A9] h-[65px] mb-2 flex justify-center rounded-lg items-center'
            onPress={onPrintQR}
        >
            <Text className='text-white font-bold text-lg'>Print QR For Menu</Text>
        </TouchableOpacity>
    </View>
);

export default ActionButtons;
