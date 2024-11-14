import { View, Text, Image } from 'react-native'
import React from 'react'

const MenuItem = ({ title, category, price, image }) => {
    return (
        <View
            className='w-[220px] h-[250px] bg-white rounded-2xl m-4 shadow-lg'
        >
            <View
                className='w-full h-[160px] rounded-t-2xl overflow-hidden bg-gray-50'
            >
                <Image
                    source={image}
                    resizeMode='cover'
                    className='w-full h-full'
                />
            </View>
            <View
                className='p-4 space-y-1'
            >
                <Text className='font-bold text-lg tracking-tight text-gray-800'>{title}</Text>
                <Text className='text-sm text-gray-500'>{category}</Text>
                <Text className='text-lg font-semibold text-green-600'>${price}</Text>
            </View>
        </View>
    )
}

export default MenuItem