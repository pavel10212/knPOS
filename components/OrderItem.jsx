import { View, Text, TouchableOpacity, Image } from 'react-native'
import { useState } from 'react'
import icons from '../constants/icons'
import OrderNotesModal from './OrderNotesModal'

const OrderItem = ({ order, onNotesChange }) => {
    const [selected, setSelected] = useState([])
    const [notesModal, setNotesModal] = useState(false)
    const [editingNoteIndex, setEditingNoteIndex] = useState(0)

    const handleDropdownClick = () => {
        if (selected.includes(order.name)) {
            setSelected(selected.filter((item) => item !== order.name))
        } else {
            setSelected([...selected, order.name])
        }
    }

    const handleEditNotes = (index) => {
        setEditingNoteIndex(index);
        setNotesModal(true);
    }

    return (
        <View className='rounded-xl bg-[#EAF0F0] mb-2 w-full'>
            <TouchableOpacity
                onPress={() => handleDropdownClick()}
                className='flex mt-2 flex-row justify-between items-center relative p-4'
            >
                <Text className='font-semibold text-lg'>{order.name}</Text>
                <View className='flex flex-row items-center'>
                    <Text className='font-bold text-lg'>x{order.quantity}</Text>
                    {order.quantity > 1 && (
                        <Image
                            source={icons.dropdown}
                            className='w-4 h-4 ml-2'
                            style={{ transform: [{ rotate: selected.includes(order.name) ? '180deg' : '0deg' }] }}
                            resizeMode='contain'
                        />
                    )}
                </View>
            </TouchableOpacity>

            {!selected.includes(order.name) ? (
                <View className='flex flex-row justify-between mt-4 mb-2'>
                    <TouchableOpacity onPress={() => handleEditNotes(0)} className='flex-1 ml-4'>
                        <Text>
                            Notes: <Text className='font-semibold'>{order.individualNotes?.[0] || 'Add notes...'}</Text>
                        </Text>
                    </TouchableOpacity>
                    <Text className='mr-4 font-bold'>${order.price * order.quantity}</Text>
                </View>
            ) : (
                <View className='mt-2 mb-2'>
                    {[...Array(order.quantity)].map((_, index) => (
                        <View key={index} className='border-t border-gray-300 py-2'>
                            <View className='flex flex-row justify-between px-4'>
                                <Text className='font-semibold'>{order.name} #{index + 1}</Text>
                                <Text className='font-bold'>${order.price}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleEditNotes(index)} className='px-4 mt-1'>
                                <Text>
                                    Notes: <Text className='font-semibold'>
                                        {order.individualNotes?.[index] || 'Add notes...'}
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
            <OrderNotesModal
                visible={notesModal}
                onClose={() => setNotesModal(false)}
                onSave={(notes) => {
                    onNotesChange(editingNoteIndex, notes);
                    setNotesModal(false);
                }}
                initialNotes={order.individualNotes?.[editingNoteIndex] || ''}
            />
        </View>
    )
}

export default OrderItem