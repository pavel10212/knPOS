import { View, Text, TouchableOpacity, Image } from 'react-native'
import { useState } from 'react'
import OrderNotesModal from './OrderNotesModal'
import { useSharedStore } from '../hooks/useSharedStore'

const OrderItem = ({ order, onNotesChange }) => {
    const [selected, setSelected] = useState([])
    const [notesModal, setNotesModal] = useState(false)
    const [editingNoteIndex, setEditingNoteIndex] = useState(0)
    const { menu } = useSharedStore((state) => state.menu)

    const handleDropdownClick = () => {
        if (selected.includes(order.orderId)) {
            setSelected(selected.filter(id => id !== order.orderId))
        } else {
            setSelected([...selected, order.orderId])
        }
    }

    const handleEditNotes = (index) => {
        setEditingNoteIndex(index);
        setNotesModal(true);
    }

    const orderItems = order.orderDetails?.map(item => {
        const menuItem = menu?.menuItems?.find(mi => mi.menu_item_id === item.menu_item_id);
        return {
            id: item.menu_item_id,
            name: menuItem?.menu_item_name || `Unknown Item #${item.menu_item_id}`,
            quantity: item.quantity,
            price: menuItem?.price || 0
        }
    })

    return (
        <View className='rounded-xl bg-[#EAF0F0] mb-2 w-full'>
            <TouchableOpacity
                onPress={handleDropdownClick}
                className='flex mt-2 flex-row items-center relative p-4'
            >
                <Text
                    className='font-semibold text-center justify-center'
                >Order ID: {order.orderId}</Text>
            </TouchableOpacity>

            {selected.includes(order.orderId) && (
                <View className='mt-2 mb-2'>
                    {orderItems?.map((item, index) => (
                        <View key={index} className='border-t border-gray-300 py-2'>
                            <View className='flex flex-row justify-between px-4'>
                                <Text className='font-semibold'>{item.name}</Text>
                                <Text className='font-bold'>x{item.quantity}</Text>
                            </View>
                            <TouchableOpacity onPress={() => handleEditNotes(index)} className='px-4 mt-1'>
                                <Text>
                                    Notes: <Text className='font-semibold'>
                                        {order.notes?.[index] || 'Add notes...'}
                                    </Text>
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                    <View className='border-t border-gray-300 py-2 px-4'>
                        <Text className='font-bold text-right'>Total: {order.total}</Text>
                    </View>
                </View>
            )}

            <OrderNotesModal
                visible={notesModal}
                onClose={() => setNotesModal(false)}
                onSave={(notes) => {
                    onNotesChange(editingNoteIndex, notes);
                    setNotesModal(false);
                }}
                initialNotes={order.notes?.[editingNoteIndex] || ''}
            />
        </View>
    )
}

export default OrderItem