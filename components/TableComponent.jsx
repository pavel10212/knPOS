import { Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import React from 'react'
import { tableStore } from '../hooks/useStore';

const TableComponent = ({
    table_num,
    orders,
    capacity,
    status,
    reservation_details,
    location,
    rotation
}) => {
    const SCALE_FACTOR = 0.8;
    const OFFSET_X = -50;
    const OFFSET_Y = 50;

    const selectTable = tableStore((state) => state.selectTable)
    const dropdownTableNumber = tableStore((state) => state.dropdownTableNumber)
    const setDropdownTable = tableStore((state) => state.setDropdownTable)
    const updateTableStatus = tableStore((state) => state.updateTableStatus)

    const isDropdownOpen = dropdownTableNumber === table_num;

    const ifLongPressed = () => {
        setDropdownTable(isDropdownOpen ? null : table_num);
    }

    const handleStatusChange = async (newStatus) => {
        if (newStatus === 'reserved') {
            handleReservation(table_num);
            return;
        }
        try {
            const success = await updateTableStatus(table_num, newStatus);
            if (!success) throw new Error('Failed to update table status');
            setDropdownTable(null);
        } catch (error) {
            console.error('Error updating table status:', error);
        }
    };

    const getBackgroundColor = () => {
        switch (status) {
            case 'Unavailable': return 'bg-red-700'
            case 'Available': return 'bg-green-600'
            case 'Reserved': return 'bg-yellow-500'
            default: return 'bg-gray-500'
        }
    }

    const getTableSize = () => {
        switch (capacity) {
            case 2: return 'w-32 h-32'
            case 6: return 'w-48 h-32'
            default: return 'w-32 h-32'
        }
    }

    const shape = capacity === 2 ? 'rounded-full' : 'rounded-lg'

    const getDropdownPosition = () => {
        const baseLeft = ((location?.x || 0) * SCALE_FACTOR) + OFFSET_X;
        const baseTop = ((location?.y || 0) * SCALE_FACTOR) + OFFSET_Y;
        
        // Adjust position based on rotation
        if (rotation === 90 || rotation === -270) {
            return {
                left: baseLeft - (capacity === 6 ? 20 : 0),  // Adjust for wider tables
                top: baseTop + (capacity === 6 ? 150 : 120)
            };
        }
        
        return {
            left: baseLeft,
            top: baseTop + (capacity === 6 ? 120 : 120)
        };
    };

    return (
        <View style={{ position: 'relative' }}>
            {isDropdownOpen && (
                <TouchableWithoutFeedback onPress={() => setDropdownTable(null)}>
                    <View 
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 998
                        }}
                    />
                </TouchableWithoutFeedback>
            )}
            
            <View style={{
                position: 'absolute',
                left: ((location?.x || 0) * SCALE_FACTOR) + OFFSET_X,
                top: ((location?.y || 0) * SCALE_FACTOR) + OFFSET_Y,
                transform: [{ rotate: `${rotation || 0}deg` }],
                zIndex: 1
            }}>
                <TouchableOpacity
                    onPress={(e) => {
                        e.stopPropagation();
                        selectTable({ table_num, orders, capacity, status, reservation_details });
                    }}
                    onLongPress={(e) => {
                        e.stopPropagation();
                        ifLongPressed();
                    }}
                    className={`${getBackgroundColor()} ${getTableSize()} ${shape} justify-center items-center relative border-2 border-white`}
                >
                    <View className="absolute inset-0 flex justify-center items-center">
                        <Text className="text-white font-semibold text-base text-center">Table {table_num}</Text>
                        <Text className="text-white text-sm text-center">{capacity} Persons</Text>
                    </View>

                    {status === 'Reserved' && reservation_details && (
                        <View className="absolute bottom-1 left-2 right-2 rounded-sm">
                            <Text className="text-white text-xs text-center" numberOfLines={1}>
                                {reservation_details}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {isDropdownOpen && (
                <View 
                    style={{
                        position: 'absolute',
                        ...getDropdownPosition(),
                        backgroundColor: 'white',
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#e5e7eb',
                        width: 160,
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                        zIndex: 999
                    }}
                >
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
    )
}

export default TableComponent