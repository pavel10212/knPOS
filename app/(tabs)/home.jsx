import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import icons from '../../constants/icons'
import TableList from '../../components/TableList'

const Home = () => {
    const [floor, setFloor] = useState(0)
    const [selectedTable, setSelectedTable] = useState(null);

    const handleTableSelect = (tableData) => {
        setSelectedTable(tableData);
        console.log("Selected table:", tableData);
    };

    return (
        <SafeAreaView className='flex flex-col bg-white'>
            <View className='flex flex-row h-screen w-full'>
                {/* Left side with Table List */}
                <View className='flex-1'>
                    <View className='flex flex-row h-[60px] items-center justify-start border-hairline'>
                        <Text className='ml-5 font-bold text-2xl'>Table List</Text>
                        <TouchableOpacity className='absolute right-14 rounded-xl bg-primary w-[115px] h-[40px] justify-center'>
                            <Text className='text-center'>
                                First Floor
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity className='absolute right-3'>
                            <Image
                                source={icons.plus}
                                className="w-8 h-8"
                                resizeMode='contain'
                            />
                        </TouchableOpacity>
                    </View>
                    <TableList
                        floor={floor}
                        isEditing={false}
                        onTableSelect={handleTableSelect}
                    />
                </View>

                {/* Right side Orders section */}
                <View className='w-[300px] h-full bg-white border-hairline'>
                    <View className='h-[60px] flex justify-center border-hairline'>
                        <Text className='font-bold ml-5 text-2xl'>Order #</Text>
                        <View className='ml-5 flex flex-row'>
                            <Image
                                source={icons.table}
                                className='w-6 h-6'
                            />
                            <Text className='ml-1 font-semibold'>
                                Table:
                            </Text>
                        </View>
                    </View>
                    {/* Orders content goes here */}
                </View>
            </View>
        </SafeAreaView>
    )
}

export default Home