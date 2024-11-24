import { View } from 'react-native'
import React, { useState } from 'react'
import TableComponent from './TableComponent'
import StatusLegend from './StatusLegend'
import { tableStore } from '../hooks/useStore'

const TableList = ({ isEditing }) => {
    const [tablePositions, setTablePositions] = useState({});
    const { tables } = tableStore();

    const handlePositionChange = (tableNumber, newPosition) => {
        setTablePositions(prev => ({
            ...prev,
            [tableNumber]: newPosition
        }));
    };

    return (
        <View className="flex-1 bg-gray-100 p-4">
            <StatusLegend />
            <View className="flex flex-row flex-wrap gap-4">
                {tables.map((table) => (
                    <TableComponent
                        key={table.number}
                        {...table}
                        isEditing={isEditing}
                        position={tablePositions[table.number]}
                        onPositionChange={handlePositionChange}
                    />
                ))}
            </View>
        </View>
    )
}

export default TableList