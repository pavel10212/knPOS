import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const ReservationHeader = ({ 
    onNewReservation, 
    searchQuery, 
    onSearchChange,
    onClearSearch 
}) => {
    return (
        <View className="px-6 py-5 border-b border-gray-200 bg-white">
            <View className="flex-row items-center justify-between mb-5">
                <View>
                    <Text className="text-3xl font-bold text-gray-800">Reservations</Text>
                    <Text className="text-gray-500 mt-1">Manage your restaurant bookings</Text>
                </View>
                <TouchableOpacity
                    onPress={onNewReservation}
                    className="bg-blue-600 px-5 py-3 rounded-xl flex-row items-center shadow-sm">
                    <Feather name="plus" size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">New Reservation</Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mt-1">
                <Feather name="search" size={20} color="#666" />
                <TextInput
                    placeholder="Search by name..."
                    placeholderTextColor="#9ca3af"
                    className="flex-1 ml-2 text-base text-gray-800"
                    value={searchQuery}
                    onChangeText={onSearchChange}
                />
                {searchQuery ? (
                    <TouchableOpacity
                        onPress={onClearSearch}
                        className="bg-gray-200 rounded-full p-1.5">
                        <Feather name="x" size={16} color="#666" />
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
};
