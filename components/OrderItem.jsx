import { View, Text } from 'react-native'


const OrderItem = ({ order, index }) => {
    return (
        <View
            className='rounded-xl bg-[#EAF0F0] mb-2 w-full h-20'
        >
            <View
                className='flex mt-2 flex-row justify-between'
            >
                <Text
                    className='font-semibold ml-4 text-lg'
                >{order.name}</Text>
                <Text
                    className='font-bold mr-2 text-lg'
                >x{order.quantity}</Text>
            </View>
            <View
                className='flex flex-row justify-between mt-4'
            >
                <Text
                    className='ml-4'
                >
                    Customer Notes: <Text className='font-semibold'>{order.notes}</Text>
                </Text>
                <Text
                    className='mr-2 font-bold'
                >
                    ${order.price}
                </Text>
            </View>

        </View>
    )
}

export default OrderItem