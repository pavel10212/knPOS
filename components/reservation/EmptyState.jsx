import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const EmptyState = ({ dateLabel, searchQuery, onCreateNew }) => {
    return (
        <View className="py-20 items-center">
            <View className="bg-gray-50 rounded-full p-6 mb-2">
                <Feather name="calendar" size={50} color="#94a3b8" />
            </View>
            <Text className="mt-5 text-gray-700 text-xl font-semibold">
                No reservations for {dateLabel}
            </Text>
            <Text className="mt-2 text-gray-500 text-center px-10">
                {searchQuery
                    ? "Try a different search term or clear filters"
                    : `There are no reservations scheduled for ${dateLabel.toLowerCase()}`}
            </Text>
            <TouchableOpacity
                onPress={onCreateNew}
                className="mt-6 bg-blue-600 px-6 py-3.5 rounded-xl flex-row items-center shadow-sm">
                <Feather name="plus" size={18} color="white" />
                <Text className="text-white font-semibold ml-2">Create Reservation</Text>
            </TouchableOpacity>
        </View>
    );
};
