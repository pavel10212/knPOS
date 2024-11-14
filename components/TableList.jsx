import { View } from 'react-native'
import React, { useState } from 'react'
import TableComponent from './TableComponent'
import StatusLegend from './StatusLegend'

const TableList = ({ floor, isEditing, onTableSelect }) => {
    const [tablePositions, setTablePositions] = useState({});
    
    const tables = [
        { number: 1, persons: 2, status: 'unavailable' },
        { number: 2, persons: 4, status: 'available' },
        { number: 3, persons: 2, status: 'reserved' },
        { number: 4, persons: 4, status: 'available' },
        { number: 5, persons: 2, status: 'unavailable' },
        { number: 6, persons: 4, status: 'available' },
        { number: 7, persons: 4, status: 'reserved' },
        { number: 8, persons: 2, status: 'available' },
        { number: 9, persons: 4, status: 'unavailable' }
    ]

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
                        onTableSelect={() => onTableSelect(table)}
                    />
                ))}
            </View>
        </View>
    )
}

export default TableList