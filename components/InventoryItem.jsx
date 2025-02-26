import { Text, View, TouchableOpacity } from "react-native";

const InventoryItem = ({ title, quantity, unit, currentQuantity, onChangeQuantity, isEditMode, disabled }) => {
    return (
        <View className={`w-full bg-white rounded-lg mb-2 p-4 shadow-sm ${disabled ? 'opacity-50' : ''}`}>
            <View className='flex-row justify-between items-center'>
                <View>
                    <Text className='font-bold text-lg text-gray-800'>{title}</Text>
                    <Text className='text-sm text-gray-500'>Cost per unit: ${unit}</Text>
                    {disabled && (
                        <Text className='text-sm text-red-500 font-semibold mt-1'>Out of stock</Text>
                    )}
                </View>
                <View className='flex-row items-center space-x-4'>
                    {isEditMode && (
                        <TouchableOpacity
                            onPress={() => !disabled && onChangeQuantity?.('remove')}
                            className={`${disabled ? 'bg-gray-100' : 'bg-gray-200'} w-8 h-8 rounded-full items-center justify-center`}
                            disabled={disabled}
                        >
                            <Text className={`text-xl font-bold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>-</Text>
                        </TouchableOpacity>
                    )}

                    <View className='bg-gray-100 px-4 py-2 rounded-lg'>
                        <Text className='font-semibold text-lg text-gray-700'>
                            {isEditMode ? currentQuantity : quantity}
                        </Text>
                    </View>

                    {isEditMode && (
                        <TouchableOpacity
                            onPress={() => !disabled && onChangeQuantity?.('add')}
                            className={`${disabled ? 'bg-gray-100' : 'bg-gray-200'} w-8 h-8 rounded-full items-center justify-center`}
                            disabled={disabled}
                        >
                            <Text className={`text-xl font-bold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>+</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    )
}

export default InventoryItem
