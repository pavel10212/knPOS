import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import TableList from '../../components/TableList';
import icons from '../../constants/icons';

const Home = () => {
    const [floor, setFloor] = useState(0);
    const [isEditing, setIsEditing] = useState(false);

    return (
        <SafeAreaView className='flex flex-col bg-white'>
            <View className='flex flex-row h-screen w-full'>
                <View className='flex-1'>
                    <View className='flex flex-row h-[60px] items-center justify-start border-hairline'>
                        <Text className='ml-5 font-bold text-2xl'>Table Layout Editor</Text>
                        <TouchableOpacity
                            className={`ml-[15px] rounded-xl ${isEditing ? 'bg-secondary' : 'bg-primary'} w-[120px] h-[40px] justify-center`}
                            onPress={() => setIsEditing(!isEditing)}
                        >
                            <Text className='text-center'>
                                {isEditing ? 'Done Editing' : 'Edit Layout'}
                            </Text>
                        </TouchableOpacity>
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
                        isEditing={isEditing}
                        onTableSelect={() => {}}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default Home;