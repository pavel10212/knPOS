import {Image, Text, TextInput, TouchableOpacity, View} from 'react-native'
import React, {useState} from 'react'
import DateTimePickerModal from "react-native-modal-datetime-picker";
import icons from '../constants/icons';
import { tableStore } from '../hooks/useStore';
import { useReservationStore } from '../hooks/useReservationStore';

const ReservedModal = ({ visible, onClose, tableNumber }) => {
    const [customerName, setCustomerName] = useState('');
    const [description, setDescription] = useState('');
    const [time, setTime] = useState('12:00');
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const createReservation = useReservationStore(state => state.createReservation);

    if (!visible) return null;

    const handleConfirm = (date) => {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        setTime(`${hours}:${minutes}`);
        setSelectedDate(date);
        setShowTimePicker(false);
    };

    const handleTimePress = () => {
        setShowTimePicker(true);
    };

    const resetForm = () => {
        setCustomerName('');
        setDescription('');
        setTime('12:00');
        setSelectedDate(new Date());
    };

    const handleConfirmAndReset = async () => {
        try {
            // Create a proper date for the reservation time
            const currentDate = new Date();
            const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
            const reservationDate = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate(),
                hours,
                minutes
            );
            
            // Add 2 hours for end time
            const endTime = new Date(reservationDate);
            endTime.setHours(endTime.getHours() + 2);
            
            // Create a proper reservation through the reservation service
            const reservationData = {
                customer_name: customerName,
                customer_phone: 'N/A', // Required field
                party_size: 2, // Default size 
                table_id: tableNumber,
                reservation_time: reservationDate.toISOString(),
                end_time: endTime.toISOString(),
                status: 'pending',
                notes: description
            };
            
            // Create the reservation record
            await createReservation(reservationData);
            
            // Check if the reservation is within 2 hours from now
            const currentTime = new Date();
            const twoHoursFromNow = new Date(currentTime.getTime() + (2 * 60 * 60 * 1000));
            
            if (reservationDate <= twoHoursFromNow) {
                console.log(`Reservation at ${reservationDate.toLocaleTimeString()} is within 2 hours - marking table ${tableNumber} as Reserved immediately`);
                // Immediately mark the table as Reserved since it's within 2 hours
                await tableStore.getState().updateTableStatus(tableNumber, 'Reserved');
            }
            
            resetForm();
            onClose();
        } catch (error) {
            console.error('Failed to create reservation:', error);
        }
    };

    return (
        <View className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <View className="bg-white p-6 rounded-lg w-[700px] h-[400px] shadow-xl items-center">
                <Text className="text-xl font-bold mb-4">Table {tableNumber} Reservation</Text>
                <TextInput
                    className="border text-center border-gray-300 mt-4 p-2 rounded-lg mb-4 w-[600px] h-[50px]"
                    placeholder="Customer Name"
                    value={customerName}
                    onChangeText={setCustomerName}
                />
                <View className="flex flex-row items-center self-start ml-6">
                    <Text className="mr-2">Expected Arrival Time:</Text>
                    <TouchableOpacity
                        onPress={handleTimePress}
                        className="border flex flex-row items-center justify-between border-gray-300 p-3 rounded-lg w-[200px] bg-gray-50 active:bg-gray-100"
                    >
                        <Text className='text-lg'>{time}</Text>
                        <View className="flex flex-row items-center">
                            <Image
                                source={icons.clock}
                                className="w-5 h-5 ml-2"
                                resizeMode="contain"
                            />
                            <Text className="ml-2 text-blue-500">Select</Text>
                        </View>
                    </TouchableOpacity>
                </View>
                <View className="flex flex-col self-start ml-6 w-full pr-6">
                    <Text className="text-lg mb-2">Special Requests</Text>
                    <TextInput
                        className="border border-gray-300 p-2 rounded-lg mb-4 w-full h-[100px]"
                        placeholder="Enter any special requests or notes"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                    />
                </View>
                <DateTimePickerModal
                    isVisible={showTimePicker}
                    mode="time"
                    onConfirm={handleConfirm}
                    onCancel={() => setShowTimePicker(false)}
                    date={selectedDate}
                />

                <View className="flex-row justify-end gap-2 absolute bottom-6 right-6">
                    <TouchableOpacity
                        className="px-4 py-2 bg-gray-200 rounded-lg"
                        onPress={onClose}
                    >
                        <Text>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="px-4 py-2 bg-primary rounded-lg"
                        onPress={handleConfirmAndReset}
                        disabled={!customerName || !time}
                    >
                        <Text className="text-white">Confirm Reservation</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default ReservedModal;