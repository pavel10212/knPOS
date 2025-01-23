import { Image, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

const MenuItem = ({ title, category, price, image, onChangeQuantity, currentQuantity = 0 }) => {
    const handlePress = (action) => {
        if (action === 'remove' && currentQuantity === 0) return;
        onChangeQuantity(action);
    };
    return (
        <View className='w-[30%] h-[320px] bg-white rounded-2xl m-2 shadow-sm'>
            <View className='w-full h-[200px] rounded-t-2xl overflow-hidden bg-gray-50'>
                <Image source={image} resizeMode='cover' className='w-full h-full' />
            </View>
            <View className='p-4 space-y-2'>
                <Text className='font-bold text-xl tracking-tight text-gray-800'>{title}</Text>
                <Text className='text-sm text-gray-500'>{category}</Text>
                <View className='flex-row justify-between items-center mt-2'>
                    <Text className='text-xl font-semibold text-green-600'>${price}</Text>
                    <View className='flex-row items-center space-x-3'>
                        <TouchableOpacity
                            onPress={() => handlePress('remove')}
                            className='w-8 h-8 bg-gray-200 rounded-full items-center justify-center'
                            disabled={currentQuantity === 0}
                        >
                            <Text className='text-lg font-bold text-gray-600'>-</Text>
                        </TouchableOpacity>
                        <Text className='text-lg font-semibold min-w-[24px] text-center'>{currentQuantity}</Text>
                        <TouchableOpacity
                            onPress={() => handlePress('add')}
                            className='w-8 h-8 bg-primary rounded-full items-center justify-center'
                        >
                            <Text className='text-lg font-bold text-white'>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    )
}

export default MenuItem
