import {Text, TouchableOpacity, View} from 'react-native';
import {useState} from 'react';
import OrderNotesModal from './OrderNotesModal';
import {useSharedStore} from '../hooks/useSharedStore';

const OrderItem = ({ order, onNotesChange }) => {
    const [selected, setSelected] = useState([]);
    const [notesModal, setNotesModal] = useState(false);
    const [editingNoteIndex, setEditingNoteIndex] = useState(0);
    const menu = useSharedStore((state) => state.menu);

    const handleDropdownClick = () => {
        if (selected.includes(order.orderId)) {
            setSelected(selected.filter((id) => id !== order.orderId));
        } else {
            setSelected([...selected, order.orderId]);
        }
    };

    const handleEditNotes = (index) => {
        setEditingNoteIndex(index);
        setNotesModal(true);
    };

    const orderItems = order.order_details?.map((item) => {
        const menuItem = menu?.menuItems?.find(
            (mi) => mi.menu_item_id === item.menu_item_id
        );
        return {
            id: item.menu_item_id,
            name: menuItem?.menu_item_name || `Unknown Item #${item.menu_item_id}`,
            quantity: item.quantity,
            price: menuItem?.price || 0,
        };
    });


    return (
        <View className="rounded-xl bg-white shadow-md mb-4 p-4">
            <TouchableOpacity
                onPress={handleDropdownClick}
                className="flex flex-row items-center justify-between"
            >
                <Text className="font-semibold text-lg">Order ID: {order.order_id}</Text>
            </TouchableOpacity>

            {selected.includes(order.orderId) && (
                <View className="mt-4">
                    {orderItems?.map((item, index) => (
                        <View key={index} className="py-2 border-t border-gray-200">
                            <View className="flex flex-row justify-between items-center">
                                <Text className="font-medium text-base">{item.name}</Text>
                                <Text className="font-medium text-sm">
                                    x{item.quantity}
                                </Text>
                                <Text className="font-bold text-base">
                                    ${Number(item.price).toFixed(2)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => handleEditNotes(index)}
                                className="mt-2"
                            >
                                <Text className="text-sm text-blue-600">
                                    Notes: {order.notes?.[index] || 'Add notes...'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                    <View className="py-4 border-t border-gray-200">
                        <Text className="font-bold text-right text-lg">
                            Total: {order.total}
                        </Text>
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
    );
};

export default OrderItem;
