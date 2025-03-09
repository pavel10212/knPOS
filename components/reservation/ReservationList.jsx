import React from 'react';
import { View, Text } from 'react-native';
import {ReservationCard} from "./ReservationCard";
import {groupReservationsByTimeBlocks} from "../../utils/reservationUtils";

const ReservationList = ({ 
    selectedDateTab, 
    filteredReservations, 
    groupedReservations,
    statusOrder,
    onEdit,
    onStatusChange,
    onDelete,
    formatDate
}) => {
    if (selectedDateTab !== 'today') {
        const timeBlocks = groupReservationsByTimeBlocks(filteredReservations);
        
        return Object.entries(timeBlocks).map(([timeBlock, blockReservations]) => (
            <View key={timeBlock} className="mb-6">
                <View className="flex-row items-center mb-3">
                    <Text className="text-lg font-bold text-gray-800">{timeBlock}</Text>
                    <View className="bg-gray-200 px-2.5 py-0.5 rounded-full ml-2">
                        <Text className="text-gray-700 text-xs font-medium">
                            {blockReservations.length}
                        </Text>
                    </View>
                </View>
                {blockReservations.map(reservation => (
                    <ReservationCard
                        key={reservation.reservation_id}
                        reservation={reservation}
                        onEdit={onEdit}
                        onStatusChange={onStatusChange}
                        onDelete={onDelete}
                        formatDate={formatDate}
                    />
                ))}
            </View>
        ));
    }

    return statusOrder.map(status =>
        groupedReservations[status] && groupedReservations[status].length > 0 ? (
            <View key={status} className="mb-6">
                <View className="flex-row items-center mb-3">
                    <Text className="text-lg font-bold text-gray-800 capitalize">
                        {status}
                    </Text>
                    <View className="bg-gray-200 px-2.5 py-0.5 rounded-full ml-2">
                        <Text className="text-gray-700 text-xs font-medium">
                            {groupedReservations[status].length}
                        </Text>
                    </View>
                </View>
                {groupedReservations[status].map(reservation => (
                    <ReservationCard
                        key={reservation.reservation_id}
                        reservation={reservation}
                        onEdit={onEdit}
                        onStatusChange={onStatusChange}
                        onDelete={onDelete}
                        formatDate={formatDate}
                    />
                ))}
            </View>
        ) : null
    );
};


export default ReservationList;