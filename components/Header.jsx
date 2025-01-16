import {Image, Text, TextInput, TouchableOpacity, View} from 'react-native'
import React from 'react'
import icons from '../constants/icons'

const Header = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })

    return (
        <View className="border-hairline w-full h-[100px] px-4 items-center flex-row justify-between bg-white">
            <View className="flex-row items-center">
                <Image
                    source={icons.logo}
                    resizeMode="contain"
                    className="w-[90px] h-[90px]"
                />
                <View className='relative ml-[125px] h-[60px] rounded-xl border-1 flex-row items-center bg-[#ecf3f5] w-[360px]'>
                    <TextInput
                        className="pl-[25px] pr-12 flex-1 w-[20px]"
                        placeholder="Search for a product or an order..."
                    />
                    <TouchableOpacity className="absolute right-3 h-full items-center justify-center">
                        <Image
                            source={icons.search}
                            resizeMode="contain"
                            className="w-6 h-6"
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <View className='flex flex-row items-center'>
                <Image
                    source={icons.calendar}
                    className="w-6 h-6 mr-2"
                    resizeMode='contain'
                />
                <Text className="text-gray-600 text-base">
                    {currentDate}
                </Text>
            </View>
        </View>
    )
}

export default Header