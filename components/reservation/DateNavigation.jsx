import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const DateNavigation = ({ 
    dateOptions, 
    selectedDateTab, 
    onDateSelect,
    upcomingGroupedByDate 
}) => {
    const currentIndex = dateOptions.findIndex(opt => opt.value === selectedDateTab);
    
    // Calculate previous and next dates safely
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < dateOptions.length - 1;
    
    const handlePreviousDay = () => {
        if (hasPrevious) {
            onDateSelect(dateOptions[currentIndex - 1].value);
        }
    };
    
    const handleNextDay = () => {
        if (hasNext) {
            onDateSelect(dateOptions[currentIndex + 1].value);
        }
    };
    
    // Compute active reservation counts (excluding completed and cancelled)
    const activeReservationCounts = useMemo(() => {
        const result = {};
        if (!upcomingGroupedByDate) return result;
        
        Object.keys(upcomingGroupedByDate).forEach(date => {
            // Filter out completed and cancelled reservations
            const activeReservations = upcomingGroupedByDate[date].filter(
                res => !['completed', 'cancelled'].includes(res.status)
            );
            
            // Only store count if there are active reservations
            if (activeReservations.length > 0) {
                result[date] = activeReservations.length;
            }
        });
        
        return result;
    }, [upcomingGroupedByDate]);
    
    // Get current count for selected date tab
    const currentTabCount = useMemo(() => {
        if (!upcomingGroupedByDate || !selectedDateTab) return 0;
        
        const reservations = upcomingGroupedByDate[selectedDateTab] || [];
        return reservations.filter(res => !['completed', 'cancelled'].includes(res.status)).length;
    }, [upcomingGroupedByDate, selectedDateTab]);

    return (
        <>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-4 pb-1"
            >
                {dateOptions.map((dateOption) => (
                    <TouchableOpacity
                        key={dateOption.value}
                        onPress={() => onDateSelect(dateOption.value)}
                        className={`px-4 py-2 rounded-lg mr-2 ${
                            selectedDateTab === dateOption.value ? 'bg-blue-600' : 'bg-gray-100'
                        }`}
                    >
                        <Text className={`font-medium ${
                            selectedDateTab === dateOption.value ? 'text-white' : 'text-gray-700'
                        }`}>
                            {dateOption.label}
                        </Text>

                        {activeReservationCounts[dateOption.value] > 0 && (
                            <View className={`absolute -top-0 -right-1 bg-${
                                selectedDateTab === dateOption.value ? 'white' : 'blue-600'
                            } rounded-full min-w-[18px] h-[18px] items-center justify-center px-1`}>
                                <Text className={`text-xs font-bold ${
                                    selectedDateTab === dateOption.value ? 'text-blue-600' : 'text-white'
                                }`}>
                                    {activeReservationCounts[dateOption.value]}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View className="flex-row items-center justify-between mb-6 mt-4">
                <TouchableOpacity
                    onPress={handlePreviousDay}
                    className="flex-row items-center bg-white px-3 py-2 rounded-lg border border-gray-200"
                    disabled={!hasPrevious}
                >
                    <Feather
                        name="chevron-left"
                        size={18}
                        color={!hasPrevious ? "#d1d5db" : "#4b5563"}
                    />
                    <Text className={`ml-1 ${!hasPrevious ? "text-gray-300" : "text-gray-600"}`}>
                        Previous Day
                    </Text>
                </TouchableOpacity>

                <View>
                    <Text className="text-lg font-semibold text-gray-800">
                        {dateOptions.find(opt => opt.value === selectedDateTab)?.label || 'Reservations'}
                    </Text>
                    <Text className="text-center text-xs text-gray-500">
                        {currentTabCount} active reservation(s)
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={handleNextDay}
                    className="flex-row items-center bg-white px-3 py-2 rounded-lg border border-gray-200"
                    disabled={!hasNext}
                >
                    <Text className={`mr-1 ${!hasNext ? "text-gray-300" : "text-gray-600"}`}>
                        Next Day
                    </Text>
                    <Feather
                        name="chevron-right"
                        size={18}
                        color={!hasNext ? "#d1d5db" : "#4b5563"}
                    />
                </TouchableOpacity>
            </View>
        </>
    );
};
