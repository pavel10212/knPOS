import { View, Text } from 'react-native';


const PayItem = ({ item }) => (
    <View className='flex flex-row justify-between p-5 border-gray-200 border-hairline'>
        <Text className='font-semibold w-[39%]'>{item.name}</Text>
        <Text className='text-gray-501 w-[20%] text-center'>${item.price}</Text>
        <Text className='text-gray-501 w-[20%] text-center'>{item.quantity}</Text>
        <Text className='font-semibold w-[19%] text-right'>${(item.price * item.quantity).toFixed(2)}</Text>
    </View>
);

export default PayItem;