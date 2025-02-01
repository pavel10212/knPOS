import { FlatList, Text, View, TouchableOpacity } from 'react-native'
import { useMemo, useCallback, useState } from "react";
import { SafeAreaView } from 'react-native-safe-area-context'
import MenuItem from '../../components/MenuItem'
import InventoryItem from '../../components/InventoryItem';
import { useSharedStore } from '../../hooks/useSharedStore'

const Menu = () => {
    const [activeTab, setActiveTab] = useState('menu');
    const menu = useSharedStore((state) => state.menu)
    const inventory = useSharedStore((state) => state.inventory)

    const renderMenuItem = useMemo(() => ({ item }) => (
        <MenuItem
            key={`menu-item-${item.menu_item_id}`}
            title={item.menu_item_name}
            category={item.category}
            price={item.price}
            image={item.menu_item_image || '/assets/images/favicon.png'}
            description={item.description}
        />
    ), []);

    const renderInventoryItem = useMemo(() => ({ item }) => (
        <InventoryItem
            key={`inventory-item-${item.inventory_item_id}`}
            title={item.inventory_item_name}
            quantity={item.quantity}
            unit={item.cost_per_unit}
            isEditMode={false}
        />
    ), []);

    const menuKeyExtractor = useCallback((item) =>
        item.menu_item_id?.toString() || Math.random().toString(),
        []);

    const inventoryKeyExtractor = useCallback((item) =>
        item.inventory_item_id?.toString() || Math.random().toString(),
        []);

    const getItemLayout = useCallback((_, index) => ({
        length: 200,
        offset: 200 * index,
        index,
    }), []);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-1">
                <View className="px-6 py-4 bg-white border-b border-gray-200">
                    <Text className='text-2xl font-bold mb-4'>Restaurant View</Text>
                    <View className="flex-row">
                        <TouchableOpacity
                            onPress={() => setActiveTab('menu')}
                            className={`px-4 py-2 mr-2 rounded-t-lg ${activeTab === 'menu' ? 'bg-primary' : 'bg-gray-200'}`}
                        >
                            <Text className={activeTab === 'menu' ? 'text-white font-bold' : 'text-gray-600'}>Menu</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setActiveTab('inventory')}
                            className={`px-4 py-2 rounded-t-lg ${activeTab === 'inventory' ? 'bg-primary' : 'bg-gray-200'}`}
                        >
                            <Text className={activeTab === 'inventory' ? 'text-white font-bold' : 'text-gray-600'}>Inventory</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {activeTab === 'menu' ? (
                    <FlatList
                        key="menuGrid"
                        data={menu}
                        renderItem={renderMenuItem}
                        keyExtractor={menuKeyExtractor}
                        getItemLayout={getItemLayout}
                        initialNumToRender={9}
                        maxToRenderPerBatch={6}
                        windowSize={5}
                        numColumns={3}
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                        columnWrapperStyle={{ justifyContent: 'space-between', marginHorizontal: 16 }}
                    />
                ) : (
                    <FlatList
                        key="inventoryList"
                        data={inventory}
                        renderItem={renderInventoryItem}
                        keyExtractor={inventoryKeyExtractor}
                        initialNumToRender={9}
                        maxToRenderPerBatch={6}
                        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    />
                )}
            </View>
        </SafeAreaView>
    )
}

export default Menu
