import { Pressable, View } from 'react-native'
import TableComponent from './TableComponent'
import StatusLegend from './StatusLegend'
import { tableStore } from '../hooks/useStore'
import { useSharedStore } from '../hooks/useSharedStore'

const TableList = ({ isEditing, onReserve }) => {
    const setDropdownTable = tableStore((state) => state.setDropdownTable)
    const tables = useSharedStore((state) => state.tables);

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
