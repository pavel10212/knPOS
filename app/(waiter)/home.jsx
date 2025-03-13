import { FlatList, Text, View, TouchableWithoutFeedback } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import TableList from "../../components/TableList";
import QRModal from "../../components/QRModal";
import OrderItem from "../../components/OrderItem";
import OrderHeader from "../../components/OrderHeader";
import ActionButtons from "../../components/ActionButtons";
import LoadingScreen from "../../components/LoadingScreen";
import NotificationIndicator from "../../components/NotificationIndicator";
import { tableStore } from "../../hooks/useStore";
import { useHomeData } from "../../hooks/useHomeData";
import { useSharedStore } from "../../hooks/useSharedStore";
import {
  doesTableHaveOrders,
  findOrdersForTable,
} from "../../utils/orderUtils";
import { router } from "expo-router";

const Home = () => {
  const { isLoading, loadingProgress, statusMessages } = useHomeData();
  const globalLoading = useSharedStore(state => state.isLoading);
  const loadingStatus = useSharedStore(state => state.loadingStatus);
  const initializeOrders = useSharedStore(state => state.initializeOrders);

  const selectedTable = tableStore((state) => state.selectedTable);
  const setDropdownTable = tableStore((state) => state.setDropdownTable);
  const orders = useSharedStore((state) => state.orders);
  const [ordersForRender, setOrdersForRender] = useState([]);

  // Initialize orders when component mounts
  useEffect(() => {
    initializeOrders();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      const ordersList = orders || [];
      setOrdersForRender(findOrdersForTable(selectedTable.table_num, ordersList));
    }
  }, [selectedTable, orders]);

  const [isQrModalVisible, setQrModalVisible] = useState(false);

  // Function to handle direct navigation to reservation page
  const handleDirectReservation = (tableNumber) => {
    // Close any open dropdown
    setDropdownTable(null);
    
    // Navigate directly to the reservation page
    router.push({
      pathname: "/reservation",
      params: {
        createNew: true,
        selectedTableId: tableNumber,
      }
    });
  };

  // Handle outside click to close dropdowns
  const handleOutsideClick = () => {
    setDropdownTable(null);
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
    <SafeAreaView className="flex-1 bg-white" pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={handleOutsideClick}>
        <View className="flex flex-row flex-1" pointerEvents="box-none">
          {/* Left side with Table List */}
          <View className="flex-1">
            <View className="flex flex-row h-[60px] items-center justify-between border-hairline px-5">
              <Text className="font-bold text-2xl">Table List</Text>
              <NotificationIndicator />
            </View>
            <TableList isEditing={false} onReserve={handleDirectReservation} />
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
      </TouchableWithoutFeedback>

      <QRModal
        visible={isQrModalVisible}
        onClose={() => setQrModalVisible(false)}
        table_num={selectedTable?.table_num}
      />
    </SafeAreaView>
  );
};

export default Home;
