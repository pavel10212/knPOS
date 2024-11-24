import { Text, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native'
import React from 'react'
import { tableStore } from '../hooks/useStore';

const TableComponent = ({
    number,
    persons,
    status,
    reservation
}) => {
    const { selectTable, dropdownTableNumber, setDropdownTable, updateTableStatus, handleReservation } = tableStore();
    const isDropdownOpen = dropdownTableNumber === number;

    const ifLongPressed = () => {
        setDropdownTable(isDropdownOpen ? null : number);
    }

    const handleStatusChange = (newStatus) => {
        if (newStatus === 'reserved') {
            handleReservation(number);
            return;
        }
        updateTableStatus(number, newStatus);
        setDropdownTable(null);
    };

    const getBackgroundColor = () => {
        switch (status) {
            case 'unavailable': return 'bg-red-700'
            case 'available': return 'bg-green-600'
            case 'reserved': return 'bg-yellow-500'
            default: return 'bg-gray-500'
        }
    }

    const shape = persons === 2 ? 'rounded-full' : 'rounded-lg'

    return (
        <>
            {isDropdownOpen && (
                <TouchableWithoutFeedback onPress={() => setDropdownTable(null)}>
                    <View className="absolute inset-0" />
                </TouchableWithoutFeedback>
            )}
            <View>
                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation();
                        selectTable({ number, persons, status, reservation });
                    }}
                    onLongPress={(e) => {
                        e.stopPropagation();
                        ifLongPressed();
                    }}
                    className={`${getBackgroundColor()} p-4 ${shape} w-40 h-40 justify-center items-center relative`}
                >
                    <View className="absolute top-6 left-0 right-0">
                        <Text className="text-white font-bold text-xl text-center">Table {number}</Text>
                        <Text className="text-white text-base text-center mt-1">{persons} Persons</Text>
                    </View>

                    {status === 'reserved' && reservation && (
                        <View className="absolute bottom-4 left-3 right-3 rounded-md p-2">
                            <Text className="text-white text-[13px] text-center font-semibold" numberOfLines={1}>
                                {reservation.customerName}
                            </Text>
                            <Text className="text-white text-[12px] text-center mt-0.5" numberOfLines={1}>
                                {reservation.time}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {isDropdownOpen && (
                    <View className="absolute top-40 left-0 w-40 bg-white rounded-lg shadow-lg border border-gray-200 mt-3">
                        <TouchableOpacity
                            className="p-2"
                            onPress={() => handleStatusChange('available')}
                        >
                            <Text>Available</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="p-2"
                            onPress={() => {
                                setDropdownTable(null);
                                handleStatusChange('reserved')
                            }}
                        >
                            <Text>Reserved</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="p-2"
                            onPress={() => handleStatusChange('unavailable')}
                        >
                            <Text>Unavailable</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </>
    )
}

export default TableComponent