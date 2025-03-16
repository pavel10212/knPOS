import { Text, TouchableOpacity, TouchableWithoutFeedback, View, Modal, Alert } from 'react-native'
import React, { useState, useMemo } from 'react'
import { useSharedStore } from '../hooks/useSharedStore';
import { tableStore } from '../hooks/useStore';
import { cancelOrder } from '../services/orderService';
import { useRouter } from 'expo-router';
import { useReservationStore } from '../hooks/useReservationStore';

const TableComponent = ({
    table_num,
    table_id,
    capacity,
    status,
    location,
    rotation,
    token,
    onReserve,
}) => {
    const SCALE_FACTOR = 0.8;
    const OFFSET_X = 30;
    const OFFSET_Y = 15;

    const router = useRouter();

    const selectTable = tableStore((state) => state.selectTable)
    const dropdownTableNumber = tableStore((state) => state.dropdownTableNumber)
    const setDropdownTable = tableStore((state) => state.setDropdownTable)
    const updateTableStatus = tableStore((state) => state.updateTableStatus)
    const resetTableToken = tableStore((state) => state.resetTableToken)
    const orders = useSharedStore((state) => state.orders);
    const setOrders = useSharedStore((state) => state.setOrders);
    const upcomingReservations = useReservationStore(state => state.upcomingReservations);

    const isDropdownOpen = dropdownTableNumber === table_num;
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Updated useMemo to handle both string and number table numbers
    const ordersForTable = useMemo(() => {
        return orders.filter((order) => {
            // Convert both to strings for comparison to handle mixed types
            return String(order.table_num) === String(table_num) &&
                order.order_status !== 'Completed' &&
                order.order_status !== 'Cancelled';
        });
    }, [orders, table_num]);

    // Find the active reservation for this table
    const tableReservation = useMemo(() => {
        if (status !== 'Reserved') return null;

        // Find the reservation for this table that has not been completed or cancelled
        return upcomingReservations.find(
            reservation =>
                reservation.table_id === table_id &&
                !['completed', 'cancelled'].includes(reservation.status)
        );
    }, [upcomingReservations, table_id, status]);


    const ifLongPressed = () => {
        setDropdownTable(isDropdownOpen ? null : table_num);
    }

    const handleStatusChange = async (newStatus) => {
        if (newStatus === 'Reserved') {
            // Close the dropdown
            setDropdownTable(null);

            // Check if the table has any active reservations within next 2 hours
            const now = new Date();
            const twoHoursLater = new Date(now.getTime() + (2 * 60 * 60 * 1000));

            const checkResult = useReservationStore.getState().checkTableAvailabilityLocal(
                table_id,
                now.toISOString(),
                twoHoursLater.toISOString()
            );

            if (!checkResult.available) {
                // Show conflict details
                const conflicts = checkResult.conflictingReservations;
                const conflictTimes = conflicts.map(res => {
                    const startTime = new Date(res.reservation_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    const endTime = res.end_time ? new Date(res.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "unspecified end time";

                    return `${startTime} - ${endTime} (${res.customer_name})`;
                }).join("\n");

                Alert.alert(
                    "Table Not Available",
                    `This table has existing reservations:\n\n${conflictTimes}\n\nPlease choose a different table or time.`,
                    [{ text: "OK" }]
                );
                return;
            }

            // Always navigate directly to the reservation page
            router.push({
                pathname: "/reservation",
                params: {
                    createNew: true,
                    selectedTableId: table_id,
                    selectedTableNum: table_num
                }
            });
            return;
        }

        try {
            if (newStatus === 'Available' && ordersForTable.length > 0) {
                setShowConfirmModal(true);
                return;
            }

            if (newStatus === 'Available') {
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
            // First, mark all orders for this table as cancelled instead of completed
            const updatedOrders = await Promise.all(
                ordersForTable.map(async (order) => {
                    const updatedOrderDetails = JSON.stringify(
                        order.order_details.map((detail) => ({
                            ...detail,
                            status: "Cancelled"
                        }))
                    );

                    // Use our new cancelOrder function with a reason
                    return await cancelOrder(
                        order, 
                        updatedOrderDetails, 
                        "Table marked as available before order completion"
                    );
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

    const getCounterRotation = () => ({ transform: [{ rotate: `${-(rotation || 0)}deg` }] });

    const handleOutsideClick = () => {
        setDropdownTable(null);
    };

    const viewReservationDetails = () => {
        if (!tableReservation) return;

        // Close any open menus
        setDropdownTable(null);

        // Navigate to reservation page with this reservation highlighted
        router.push({
            pathname: "/reservation",
            params: {
                viewReservation: true,
                reservationId: tableReservation.reservation_id
            }
        });
    };

    const handleTableClick = (e) => {
        e.stopPropagation();
        if (isDropdownOpen) {
            handleOutsideClick();
            return;
        }
        selectTable({ table_num, orders, capacity, status, token });
    };

    return (
        <View style={{ position: 'relative' }}>
            {/* Table Container */}
            <View style={{
                position: 'absolute',
                ...getBasePosition(),
                transform: [{ rotate: `${rotation || 0}deg` }],
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
                            <TouchableOpacity onPress={viewReservationDetails} className="mt-1">
                                <Text className="text-white text-xs underline">
                                    View Details
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </TouchableOpacity>
            </View>

            {/* Dropdown Overlay */}
            {isDropdownOpen && (
                <TouchableWithoutFeedback onPress={handleOutsideClick}>
                    <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 998
                    }} />
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
                    {/* TouchableWithoutFeedback wrapper to stop event propagation */}
                    <TouchableWithoutFeedback onPress={(e) => {
                        // Prevent the click from reaching parent handlers
                        e.stopPropagation();
                    }}>
                        <View>
                            {/* Only show Available option if the table is not already available */}
                            {status !== 'Available' && (
                                <TouchableOpacity className="p-2" onPress={() => handleStatusChange('Available')}>
                                    <Text>Available</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity className="p-2" onPress={() => handleStatusChange('Reserved')}>
                                <Text>Reserved</Text>
                            </TouchableOpacity>
                            {/* Only show Unavailable option if the table is not already unavailable */}
                            {status !== 'Unavailable' && (
                                <TouchableOpacity className="p-2" onPress={() => handleStatusChange('Unavailable')}>
                                    <Text>Unavailable</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
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
                                <Text className="text-xl font-bold mb-4 text-gray-800">Cancel Orders & Change
                                    Status</Text>
                                <Text className="mb-4 text-gray-600 text-base">
                                    This table has {ordersForTable.length} active
                                    order{ordersForTable.length > 1 ? 's' : ''}.
                                </Text>
                                <Text className="mb-8 text-gray-600 text-base">
                                    Would you like to mark {ordersForTable.length > 1 ? 'all orders' : 'the order'} as
                                    cancelled
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
                                        <Text className="text-white font-medium">Cancel Orders & Mark Available</Text>
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