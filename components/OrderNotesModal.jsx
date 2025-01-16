import {Modal, Text, TextInput, TouchableOpacity, View} from 'react-native'
import React, {useEffect, useState} from 'react'

const OrderNotesModal = ({ visible, onClose, onSave, initialNotes = '' }) => {
    const [notes, setNotes] = useState(initialNotes);

    useEffect(() => {
        setNotes(initialNotes);
    }, [initialNotes]);

    const handleSave = () => {
        onSave(notes);
        setNotes('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
        >
            <View className="flex-1 bg-black/50 justify-center items-center">
                <View className="bg-white w-[400px] rounded-lg p-6">
                    <Text className="text-xl font-bold mb-4">Add Notes</Text>
                    <TextInput
                        className="border border-gray-300 rounded-lg p-3 min-h-[100px] mb-4"
                        multiline
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Enter special instructions..."
                    />
                    <View className="flex-row justify-end space-x-3">
                        <TouchableOpacity
                            onPress={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200"
                        >
                            <Text>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSave}
                            className="px-4 py-2 rounded-lg bg-primary"
                        >
                            <Text className="text-white">Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    )
}

export default OrderNotesModal