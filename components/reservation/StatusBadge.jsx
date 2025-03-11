import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const StatusBadge = ({ status }) => {
    const statusStyles = {
        pending: { 
            bg: 'bg-amber-100', 
            text: 'text-amber-700', 
            icon: 'clock',
            description: 'Not yet confirmed'
        },
        confirmed: { 
            bg: 'bg-green-100', 
            text: 'text-green-700', 
            icon: 'check-circle',
            description: 'Confirmed, not yet seated'
        },
        seated: { 
            bg: 'bg-blue-100', 
            text: 'text-blue-700', 
            icon: 'users',
            description: 'Guests are seated'
        },
        completed: { 
            bg: 'bg-purple-100', 
            text: 'text-purple-700', 
            icon: 'check-square',
            description: 'Reservation completed'
        },
        canceled: { 
            bg: 'bg-red-100', 
            text: 'text-red-700', 
            icon: 'x-circle',
            description: 'Reservation canceled'
        }
    };

    const style = statusStyles[status] || statusStyles.pending;

    return (
        <View className={`ml-3 px-3 py-1.5 rounded-full ${style.bg} flex-row items-center`}>
            <Feather name={style.icon} size={14} color={style.text.replace('text-', '').replace('-700', '')} />
            <Text className={`${style.text} font-medium capitalize text-xs ml-1.5`}>{status}</Text>
        </View>
    );
};
