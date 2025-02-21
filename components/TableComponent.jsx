import {Text, TouchableOpacity, TouchableWithoutFeedback, View, Modal} from 'react-native'
import React, {useState} from 'react'
import {useSharedStore} from '../hooks/useSharedStore';
import {tableStore} from '../hooks/useStore';
import {updateOrderStatus} from '../services/orderService';

const TableComponent = ({
                            table_num,
                            capacity,
                            status,
                            reservation_details,
                            location,
                            rotation,
                            token,
                            onReserve
                        }) => {
    const SCALE_FACTOR = 0.8;
    const OFFSET_X = -50;
    const OFFSET_Y = 50;

    const selectTable = tableStore((state) => state.selectTable)
    const dropdownTableNumber = tableStore((state) => state.dropdownTableNumber)
    const setDropdownTable = tableStore((state) => state.setDropdownTable)
    const updateTableStatus = tableStore((state) => state.updateTableStatus)
    const resetTableToken = tableStore((state) => state.resetTableToken)
    const orders = useSharedStore((state) => state.orders);
    const setOrders = useSharedStore((state) => state.setOrders);

    const isDropdownOpen = dropdownTableNumber === table_num;
    const [isReservationVisible, setIsReservationVisible] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const ordersForTable = orders.filter((order) => order.table_num === table_num && order.order_status !== 'Completed');


    const ifLongPressed = () => {
        setIsReservationVisible(false);
        setDropdownTable(isDropdownOpen ? null : table_num);
    }

    const handleStatusChange = async (newStatus) => {
        if (newStatus === 'reserved') {
            setDropdownTable(null);
            onReserve(table_num);
            return;
        }
        try {
            if (newStatus === 'available' && ordersForTable.length > 0) {
                setShowConfirmModal(true);
                return;
            }
            
            if (newStatus === 'available') {
                await resetTableToken(table_num);
            } else {
                const success = await updateTableStatus(table_num, newStatus);
                if (!success) throw new Error('Failed to update table status');
            }
            setDropdownTable(null);
        } catch (error) {
            console.error('Error updating table status:', error);
        }
    };

    const confirmStatusChange = async () => {
        try {
            // First, mark all orders for this table as completed
            const updatedOrders = await Promise.all(
                ordersForTable.map(async (order) => {
                    const updatedOrderDetails = JSON.stringify(
                        order.order_details.map((detail) => ({
                            ...detail,
                            status: "completed"
                        }))
                    );

                    return await updateOrderStatus(order, updatedOrderDetails);
                })
            );

            // Update orders in the store
            setOrders([
                ...orders.filter((order) => !ordersForTable.includes(order)),
                ...updatedOrders,
            ]);

            await resetTableToken(table_num);

            setShowConfirmModal(false);
            setDropdownTable(null);
        } catch (error) {
            console.error('Error updating table status:', error);
        }
    };

    const getBackgroundColor = () => {
        switch (status) {
            case 'Unavailable':
                return 'bg-red-700'
            case 'Available':
                return 'bg-green-600'
            case 'Reserved':
                return 'bg-yellow-500'
            default:
                return 'bg-gray-500'
        }
    }

    const getTableSize = () => {
        switch (capacity) {
            case 2:
                return 'w-32 h-32'
            case 6:
                return 'w-48 h-32'
            default:
                return 'w-32 h-32'
        }
    }

    const shape = capacity === 2 ? 'rounded-full' : 'rounded-lg'

    const getBasePosition = () => ({
        left: ((location?.x || 0) * SCALE_FACTOR) + OFFSET_X,
        top: ((location?.y || 0) * SCALE_FACTOR) + OFFSET_Y
    });

    const getDropdownPosition = () => {
        const base = getBasePosition();

        if (rotation === 90 || rotation === -270) {
            return {
                left: base.left - (capacity === 6 ? 20 : 0),
                top: base.top + (capacity === 6 ? 150 : 120)
            };
        }

        return {
            left: base.left,
            top: base.top + 120
        };
    };

    const getReservationPosition = () => {
        const base = getBasePosition();
        return {
            left: base.left - 20,
            top: base.top - 100
        };
    };

    const getCounterRotation = () => ({
        transform: [{rotate: `${-(rotation || 0)}deg`}]
    });

    const handleOutsideClick = () => {
        setIsReservationVisible(false);
        setDropdownTable(null);
    };

    const toggleReservationDetails = (e) => {
        e.stopPropagation();
        if (isDropdownOpen) return;
        setIsReservationVisible(!isReservationVisible);
    };

    const handleTableClick = (e) => {
        e.stopPropagation();
        if (isDropdownOpen || isReservationVisible) {
            handleOutsideClick();
            return;
        }
        selectTable({table_num, orders, capacity, status, reservation_details, token});
    };

    return (
        <View style={{position: 'relative'}}>
            {/* Table Container */}
            <View style={{
                position: 'absolute',
                ...getBasePosition(),
                transform: [{rotate: `${rotation || 0}deg`}],
                zIndex: 1
            }}>
                <TouchableOpacity
                    onPress={handleTableClick}
                    onLongPress={ifLongPressed}
                    className={`${getBackgroundColor()} ${getTableSize()} ${shape} justify-center items-center relative border-2 border-white`}
                >
                    <View className="absolute inset-0 flex justify-center items-center" style={getCounterRotation()}>
                        <Text className="text-white font-semibold text-base text-center">Table {table_num}</Text>
                        <Text className="text-white text-sm text-center">{capacity} Persons</Text>
                        {status === 'Reserved' && (
                            <TouchableOpacity onPress={toggleReservationDetails} className="mt-1">
                                <Text className="text-white text-xs underline">
                                    {isReservationVisible ? 'Hide Details' : 'View Details'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Dropdown Overlay */}
            {(isDropdownOpen || isReservationVisible) && (
                <TouchableWithoutFeedback onPress={handleOutsideClick}>
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 998
                    }}/>
                </TouchableWithoutFeedback>
            )}

            {/* Status Dropdown */}
            {isDropdownOpen && (
                <View style={{
                    position: 'absolute',
                    ...getDropdownPosition(),
                    backgroundColor: 'white',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#e5e7eb',
                    width: 160,
                    zIndex: 999
                }}>
                    <TouchableOpacity className="p-2" onPress={() => handleStatusChange('available')}>
                        <Text>Available</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2" onPress={() => handleStatusChange('reserved')}>
                        <Text>Reserved</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="p-2" onPress={() => handleStatusChange('unavailable')}>
                        <Text>Unavailable</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Reservation Details */}
            {isReservationVisible && (
                <View style={{
                    position: 'absolute',
                    ...getReservationPosition(),
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    borderRadius: 8,
                    padding: 12,
                    width: 200,
                    zIndex: 999
                }}>
                    <Text className="text-white text-sm font-bold mb-1">
                        {reservation_details?.customerName}
                    </Text>
                    <Text className="text-white text-xs mb-2">
                        Arrival: {reservation_details?.arrivalTime}
                    </Text>
                    {reservation_details?.specialRequests && (
                        <View className="border-t border-white/20 pt-2">
                            <Text className="text-white/80 text-xs mb-1">Special Requests:</Text>
                            <Text className="text-white text-xs italic">
                                {reservation_details.specialRequests}
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showConfirmModal}
                onRequestClose={() => setShowConfirmModal(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowConfirmModal(false)}>
                    <View className="flex-1 justify-center items-center bg-black/50">
                        <TouchableWithoutFeedback>
                            <View className="bg-white p-8 rounded-xl w-[450px] shadow-xl">
                                <Text className="text-xl font-bold mb-4 text-gray-800">Complete Orders & Change
                                    Status</Text>
                                <Text className="mb-4 text-gray-600 text-base">
                                    This table has {ordersForTable.length} active
                                    order{ordersForTable.length > 1 ? 's' : ''}.
                                </Text>
                                <Text className="mb-8 text-gray-600 text-base">
                                    Would you like to mark {ordersForTable.length > 1 ? 'all orders' : 'the order'} as
                                    completed
                                    and change the table status to available?
                                </Text>
                                <View className="flex-row justify-end space-x-6">
                                    <TouchableOpacity
                                        onPress={() => {
                                            setShowConfirmModal(false);
                                            setDropdownTable(false);
                                        }}
                                        className="px-6 py-3 rounded-lg bg-gray-100 border border-gray-200"
                                    >
                                        <Text className="text-gray-600 font-medium">Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={confirmStatusChange}
                                        className="px-6 py-3 rounded-lg bg-blue-500 shadow-sm"
                                    >
                                        <Text className="text-white font-medium">Complete & Mark Available</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    )
}

export default TableComponent