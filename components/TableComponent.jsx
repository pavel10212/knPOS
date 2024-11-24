import { Text, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native'
import React from 'react'
import { tableStore } from '../hooks/useStore';

const TableComponent = ({
    number,
    persons,
    status,
}) => {
    const { selectTable, selectedTable, dropdownTableNumber, setDropdownTable, updateTableStatus } = tableStore();
    const isDropdownOpen = dropdownTableNumber === number;

    const ifLongPressed = () => {
        setDropdownTable(isDropdownOpen ? null : number);
    }

    const handleStatusChange = (newStatus) => {
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
                        selectTable({ number, persons, status });
                    }}
                    onLongPress={(e) => {
                        e.stopPropagation();
                        ifLongPressed();
                    }}
                    className={`${getBackgroundColor()} p-4 ${shape} w-32 h-32 justify-center items-center`}
                >
                    <Text className="text-white font-bold text-lg">Table {number}</Text>
                    <Text className="text-white text-sm">{persons} Persons</Text>
                </TouchableOpacity>

                {isDropdownOpen && (
                    <View className="absolute top-32 left-0 w-32 bg-white rounded-lg shadow-lg border border-gray-200 mt-3">
                        <TouchableOpacity
                            className="p-2"
                            onPress={() => handleStatusChange('available')}
                        >
                            <Text>Available</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="p-2"
                            onPress={() => handleStatusChange('reserved')}
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