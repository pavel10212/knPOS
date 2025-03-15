import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';
import { StatusBadge } from './StatusBadge';

export const ReservationCard = ({ 
    reservation, 
    onEdit, 
    onStatusChange, 
    onDelete,
    formatDate 
}) => {
    // Check if reservation is in the past (end time or reservation time + 2 hours is in the past)
    const isPast = () => {
        const now = new Date();
        const reservationTime = new Date(reservation.reservation_time);
        const endTime = reservation.end_time ? new Date(reservation.end_time) : 
            new Date(reservationTime.getTime() + (2 * 60 * 60 * 1000)); // Default 2 hours
        
        return now > endTime;
    };
    
    // Determine which status change buttons to show based on current status
    const showSeatButton = ['pending', 'confirmed'].includes(reservation.status);
    const showCompleteButton = ['seated'].includes(reservation.status) || 
        (isPast() && ['pending', 'confirmed'].includes(reservation.status));
    const showCancelButton = !['completed', 'canceled'].includes(reservation.status);

    return (
        <View className="bg-white border border-gray-100 rounded-xl p-5 mb-4 shadow-sm">
            <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                    <View className="flex-row items-center">
                        <Text className="text-xl font-bold text-gray-800">{reservation.customer_name}</Text>
                        <StatusBadge status={reservation.status} />
                    </View>

                    <View className="flex-row items-center mt-3 flex-wrap">
                        <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full mb-2 mr-2">
                            <Feather name="users" size={14} color="#6b7280" />
                            <Text className="text-gray-600 ml-1.5 text-sm">Party of {reservation.party_size}</Text>
                        </View>
                        <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full mb-2 mr-2">
                            <Feather name="clock" size={14} color="#6b7280" />
                            <Text className="text-gray-600 ml-1.5 text-sm">{formatDate(reservation.reservation_time)}</Text>
                        </View>
                        <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full mb-2">
                            <Feather name="map-pin" size={14} color="#6b7280" />
                            <Text className="text-gray-600 ml-1.5 text-sm">Table #{reservation.table_num || reservation.table_id}</Text>
                        </View>
                    </View>

                    {reservation.customer_phone && (
                        <View className="flex-row items-center mt-1">
                            <Feather name="phone" size={14} color="#6b7280" />
                            <Text className="text-gray-600 ml-2 text-sm">{reservation.customer_phone}</Text>
                        </View>
                    )}

                    {reservation.customer_email && (
                        <View className="flex-row items-center mt-1.5">
                            <Feather name="mail" size={14} color="#6b7280" />
                            <Text className="text-gray-600 ml-2 text-sm">{reservation.customer_email}</Text>
                        </View>
                    )}

                    {reservation.notes && (
                        <View className="mt-4 bg-amber-50 p-3.5 rounded-xl">
                            <View className="flex-row items-center mb-1">
                                <Feather name="file-text" size={14} color="#92400e" />
                                <Text className="font-medium text-amber-800 ml-1.5 text-sm">Notes</Text>
                            </View>
                            <Text className="text-amber-700 text-sm">{reservation.notes}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View className="flex-row justify-end mt-4 pt-3 border-t border-gray-100">
                <TouchableOpacity
                    onPress={() => onEdit(reservation)}
                    className="mr-2 bg-blue-50 px-3 py-2 rounded-lg flex-row items-center">
                    <Feather name="edit-2" size={16} color="#1d4ed8" />
                    <Text className="text-blue-700 font-medium ml-1.5 text-sm">Edit</Text>
                </TouchableOpacity>

                {showSeatButton && (
                    <TouchableOpacity
                        onPress={() => onStatusChange(reservation.reservation_id, 'seated')}
                        className="mr-2 bg-indigo-50 px-3 py-2 rounded-lg flex-row items-center">
                        <Feather name="users" size={16} color="#4f46e5" />
                        <Text className="text-indigo-700 font-medium ml-1.5 text-sm">Seat</Text>
                    </TouchableOpacity>
                )}
                
                {showCompleteButton && (
                    <TouchableOpacity
                        onPress={() => onStatusChange(reservation.reservation_id, 'completed')}
                        className="mr-2 bg-purple-50 px-3 py-2 rounded-lg flex-row items-center">
                        <Feather name="check-circle" size={16} color="#7e22ce" />
                        <Text className="text-purple-700 font-medium ml-1.5 text-sm">Complete</Text>
                    </TouchableOpacity>
                )}

                {showCancelButton && (
                    <TouchableOpacity
                        onPress={() => onStatusChange(reservation.reservation_id, 'canceled')}
                        className="mr-2 bg-red-50 px-3 py-2 rounded-lg flex-row items-center">
                        <Feather name="x" size={16} color="#b91c1c" />
                        <Text className="text-red-700 font-medium ml-1.5 text-sm">Cancel</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={() => onDelete(reservation.reservation_id)}
                    className="bg-gray-100 p-2.5 rounded-lg">
                    <Feather name="trash-2" size={16} color="#666" />
                </TouchableOpacity>
            </View>
        </View>
    );
};