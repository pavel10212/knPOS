
import { View, Text } from 'react-native'
import React from 'react'

const StatusLegend = () => {
    const statuses = [
        { color: 'bg-red-700', label: 'Unavailable' },
        { color: 'bg-green-600', label: 'Available' },
        { color: 'bg-yellow-500', label: 'Reserved' },
    ]

    return (
        <View className="flex flex-row gap-6 mb-4">
            {statuses.map((status, index) => (
                <View key={index} className="flex flex-row items-center">
                    <View className={`w-5 h-5 rounded-full ${status.color} mr-2`} />
                    <Text className="text-base font-medium">{status.label}</Text>
                </View>
            ))}
        </View>
    )
}

export default StatusLegend