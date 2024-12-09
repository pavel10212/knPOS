import { View, Pressable } from 'react-native'
import React from 'react'
import TableComponent from './TableComponent'
import StatusLegend from './StatusLegend'
import { tableStore } from '../hooks/useStore'

const TableList = ({ isEditing, onReserve }) => {
    const { tables, setDropdownTable } = tableStore();

    return (
        <Pressable
            onPress={() => setDropdownTable(null)}
            className="flex-1 bg-gray-100"
        >
            <StatusLegend />
            <View className="flex-1">
                <View className="relative flex-1">
                    {tables.map((table) => (
                        <TableComponent
                            key={table.table_id}
                            {...table}
                            isEditing={isEditing}
                            onReserve={onReserve}
                        />
                    ))}
                </View>
            </View>
        </Pressable>
    )
}

export default TableList