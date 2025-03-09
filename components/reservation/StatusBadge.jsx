import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const StatusBadge = ({ status }) => {
    const statusStyles = {
        confirmed: { bg: 'bg-green-100', text: 'text-green-700', icon: 'check-circle' },
        pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'clock' },
        canceled: { bg: 'bg-red-100', text: 'text-red-700', icon: 'x-circle' },
        seated: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'users' },
        completed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'check' },
    };

    const style = statusStyles[status] || statusStyles.pending;

    return (
        <View className={`px-3 py-1.5 rounded-full ${style.bg} flex-row items-center`}>
            <Feather name={style.icon} size={14} color={style.text.replace('text-', '').replace('-700', '')} />
            <Text className={`${style.text} font-medium capitalize text-xs ml-0.5`}>{status}</Text>
        </View>
    );
};
