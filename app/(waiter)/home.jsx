import { View, Text, TouchableOpacity, Image, FlatList, Pressable } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import icons from '../../constants/icons'
import TableList from '../../components/TableList'
import { tableStore } from '../../hooks/useStore'
import OrderItem from '../../components/OrderItem'
import { router } from 'expo-router'

const Home = () => {
    const { selectedTable, setDropdownTable } = tableStore();

    const renderOrder = ({ item, index }) => (
        <OrderItem
            key={index}
            order={item}
        />
    );

    return (
        <Pressable onPress={() => setDropdownTable(null)} className='flex-1'>
            <SafeAreaView className='flex-1 bg-white'>
                <View className='flex flex-row flex-1'>
                    {/* Left side with Table List */}
                    <View className='flex-1'>
                        <View className='flex flex-row h-[60px] items-center justify-start border-hairline'>
                            <Text className='ml-5 font-bold text-2xl'>Table List</Text>
                        </View>
                        <TableList
                            isEditing={false}
                        />
                    </View>

                    {/* Right side Orders section */}
                    <View className='w-[300px] bg-white border-hairline flex flex-col'>
                        <View className='h-[60px] flex justify-center border-hairline'>
                            <Text className='font-bold ml-5 text-2xl'>Order #</Text>
                            <View className='ml-5 flex flex-row'>
                                <Image
                                    source={icons.table}
                                    className='w-6 h-6'
                                />
                                <Text className='ml-1 font-semibold'>
                                    Table: {selectedTable?.number}
                                </Text>
                            </View>
                        </View>
                        <View className='flex-1'>
                            {selectedTable ? (
                                selectedTable.orders ? (
                                    <FlatList
                                        data={selectedTable.orders}
                                        renderItem={renderOrder}
                                        keyExtractor={(_, index) => index.toString()}
                                        contentContainerStyle={{ padding: 16 }}
                                        showsVerticalScrollIndicator={true}
                                    />
                                ) : (
                                    <Text className='p-4'>No orders yet</Text>
                                )
                            ) : (
                                <Text className='p-4'>Select a table to view orders</Text>
                            )}
                        </View>
                        {selectedTable ? (
                            <>
                                <View className='flex flex-row justify-between border-hairline h-[120px] items-center'>
                                    <View className='flex flex-row ml-4 justify-between'>
                                        <Text className='font-bold'>Subtotal</Text>
                                        <Text className='font-bold ml-2'>$540</Text>
                                    </View>
                                </View>
                                <View className='h-[140px] m-4 gap-2'>
                                    <View className='flex flex-row h-[65px] gap-2'>
                                        <TouchableOpacity
                                            className='bg-primary flex-1 flex rounded-lg justify-center items-center'
                                            onPress={() => {
                                                router.push('/menu')
                                            }}
                                        >
                                            <Text className='text-white font-bold text-lg'>
                                                Add To Order
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            className='bg-[#64D393] rounded-lg flex-1 flex justify-center items-center'
                                        >
                                            <Text className='text-white font-bold text-lg'>
                                                Pay
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity
                                        className='bg-[#A9A9A9] h-[65px] mb-2 flex justify-center rounded-lg items-center'
                                    >
                                        <Text className='text-white font-bold text-lg'>
                                            Print QR For Menu
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : null}
                    </View>
                </View>
            </SafeAreaView>
        </Pressable>
    )
}

export default Home