import { FlatList, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import TableList from "../../components/TableList";
import QRModal from "../../components/QRModal";
import OrderItem from "../../components/OrderItem";
import ReservedModal from "../../components/ReservedModal";
import OrderHeader from "../../components/OrderHeader";
import ActionButtons from "../../components/ActionButtons";
import LoadingScreen from "../../components/LoadingScreen";
import { tableStore } from "../../hooks/useStore";
import { useHomeData } from "../../hooks/useHomeData";
import { useSharedStore } from "../../hooks/useSharedStore";
import {
  doesTableHaveOrders,
  findOrdersForTable,
} from "../../utils/orderUtils";

const Home = () => {
  const { isLoading, loadingProgress, statusMessages } = useHomeData();
  const globalLoading = useSharedStore(state => state.isLoading);
  const loadingStatus = useSharedStore(state => state.loadingStatus);

  const selectedTable = tableStore((state) => state.selectedTable);
  const reservationModal = tableStore((state) => state.reservationModal);
  const setReservationModal = tableStore((state) => state.setReservationModal);
  const orders = useSharedStore((state) => state.orders);
  const [ordersForRender, setOrdersForRender] = useState([]);

  useEffect(() => {
    if (selectedTable) {
      setOrdersForRender(findOrdersForTable(selectedTable.table_num, orders));
    }
  }, [selectedTable, orders]);

  const [isQrModalVisible, setQrModalVisible] = useState(false);

  const handleReservation = (tableNumber) => {
    setReservationModal({ visible: true, tableNumber });
  };

  const renderOrder = ({ item }) => {
    return (
      <OrderItem
        key={item.order_id}
        order={{
          ...item,
          items: item.order_details,
          status: item.order_status,
          total: `$${item.total_amount.toFixed(2)}`,
        }}
      />
    );
  };

  // Display the loading screen during initial data loading
  if (isLoading || globalLoading) {
    return (
      <LoadingScreen
        message="Initializing System"
        progress={loadingProgress}
        statusMessages={statusMessages.length > 0 ? statusMessages : [loadingStatus]}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex flex-row flex-1">
        {/* Left side with Table List */}
        <View className="flex-1">
          <View className="flex flex-row h-[60px] items-center justify-start border-hairline">
            <Text className="ml-5 font-bold text-2xl">Table List</Text>
          </View>
          <TableList isEditing={false} onReserve={handleReservation} />
        </View>

        {/* Right side Orders section */}
        <View className="w-[300px] bg-white border-hairline flex flex-col">
          <OrderHeader selectedTable={selectedTable} />
          <View className="flex-1">
            {selectedTable ? (
              doesTableHaveOrders(selectedTable.table_num, orders) ? (
                <FlatList
                  data={ordersForRender}
                  renderItem={renderOrder}
                  keyExtractor={(item) => item.order_id.toString()}
                  contentContainerStyle={{ padding: 16 }}
                  showsVerticalScrollIndicator={true}
                />
              ) : (
                <Text className="p-4">No orders yet</Text>
              )
            ) : (
              <Text className="p-4">Select a table to view orders</Text>
            )}
          </View>
          {selectedTable ? (
            <ActionButtons
              onPrintQR={() => setQrModalVisible(true)}
              order={selectedTable?.orders || []}
            />
          ) : null}
        </View>
      </View>
      <ReservedModal
        visible={reservationModal.visible}
        tableNumber={reservationModal.tableNumber}
        onClose={() => setReservationModal({ visible: false, tableNumber: null })}
      />

      <QRModal
        visible={isQrModalVisible}
        onClose={() => setQrModalVisible(false)}
        table_num={selectedTable?.table_num}
      />
    </SafeAreaView>
  );
};

export default Home;
