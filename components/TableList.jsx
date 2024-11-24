import { View, ScrollView, Pressable } from 'react-native'
import React, { useState } from 'react'
import TableComponent from './TableComponent'
import StatusLegend from './StatusLegend'
import { tableStore } from '../hooks/useStore'

const TableList = ({ isEditing, onReserve }) => {
    const [tablePositions, setTablePositions] = useState({});
    const { tables, setDropdownTable } = tableStore();

    const handlePositionChange = (tableNumber, newPosition) => {
        setTablePositions(prev => ({
            ...prev,
            [tableNumber]: newPosition
        }));
    };

    return (
        <Pressable
            onPress={() => setDropdownTable(null)}
            className="flex-1 bg-gray-100"
        >
            <StatusLegend />
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <View className="flex flex-row flex-wrap gap-4">
                    {tables.map((table) => (
                        <TableComponent
                            key={table.number}
                            {...table}
                            isEditing={isEditing}
                            position={tablePositions[table.number]}
                            onPositionChange={handlePositionChange}
                            onReserve={onReserve}
                        />
                    ))}
                </View>
            </ScrollView>
        </Pressable>
    )
}

export default TableList