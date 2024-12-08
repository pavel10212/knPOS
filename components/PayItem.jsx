import { View, Text, Image, TouchableOpacity } from 'react-native';
import icons from '../constants/icons';

const PayItem = ({ item, deleteItem, addItem, subtractItem }) => (
    <View className='flex flex-row justify-between items-center p-5 border-gray-200 border-hairline'>
        <Text className='font-semibold w-[30%]'>{item.name}</Text>
        <Text className='text-gray-501 w-[15%] text-center'>${item.price}</Text>
        <View className='flex flex-row items-center justify-center w-[25%] gap-2'>
            <TouchableOpacity
                onPress={() => subtractItem(item)}
                className='p-1'
            >
                <Image
                    source={icons.minus}
                    className='w-5 h-5'
                    resizeMode='contain'
                />
            </TouchableOpacity>
            <Text className='text-gray-501 text-center'>{item.quantity}</Text>
            <TouchableOpacity
                onPress={() => addItem(item)}
                className='p-1'
            >
                <Image
                    source={icons.plus}
                    className='w-5 h-5'
                    resizeMode='contain'
                />
            </TouchableOpacity>
        </View>
        <Text className='font-semibold w-[15%] text-right'>${(item.price * item.quantity).toFixed(2)}</Text>
        <TouchableOpacity
            onPress={() => deleteItem(item)}
            className='w-[15%] flex items-center justify-center'>
            <Image
                source={icons.trash}
                className='w-6 h-6'
                resizeMode='contain'
            />
        </TouchableOpacity>
    </View>
);

export default PayItem;
