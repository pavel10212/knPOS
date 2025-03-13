import { View, ScrollView, TouchableWithoutFeedback } from 'react-native'
import React, { useCallback } from 'react'
import TableComponent from './TableComponent'
import { useSharedStore } from '../hooks/useSharedStore';
import { tableStore } from '../hooks/useStore';

const TableList = ({ isEditing, onSelectTable, onReserve }) => {
  const tables = useSharedStore((state) => state.tables);
  const setDropdownTable = tableStore((state) => state.setDropdownTable);
  
  const handleOutsideClick = () => {
    // Close any open dropdown when clicking outside
    setDropdownTable(null);
  };
  
  const renderTables = useCallback(() => {
    return tables.map((table) => {
      return (
        <TableComponent
          key={table.table_id}
          table_num={table.table_num}
          table_id={table.table_id}
          capacity={table.capacity}
          status={table.status}
          location={table.location}
          rotation={table.rotation}
          token={table.token}
          onReserve={onReserve}
        />
      );
    });
  }, [tables, onReserve]);

  return (
    <TouchableWithoutFeedback onPress={handleOutsideClick}>
      <ScrollView horizontal={true}>
        <View className="w-[900px] h-[700px] relative">
          {renderTables()}
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  )
}

export default TableList
