import { FlatList, Text, View } from 'react-native'
import { useMemo, useCallback } from "react";
import { SafeAreaView } from 'react-native-safe-area-context'
import MenuItem from '../../components/MenuItem'
import { useSharedStore } from '../../hooks/useSharedStore'

const Menu = () => {
    const menu = useSharedStore((state) => state.menu)

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

    const keyExtractor = useCallback((item) => item.menu_item_id.toString(), []);
    const getItemLayout = useCallback((_, index) => ({
        length: 200,
        offset: 200 * index,
        index,
    }), []);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <View className="flex-1">
                <View className="px-6 py-4 bg-white border-b border-gray-200">
                    <Text className='text-2xl font-bold'>Menu View</Text>
                </View>
                <FlatList
                    data={menu.menuItems}
                    renderItem={renderMenuItem}
                    keyExtractor={keyExtractor}
                    getItemLayout={getItemLayout}
                    initialNumToRender={9}
                    maxToRenderPerBatch={6}
                    windowSize={5}
                    numColumns={3}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    columnWrapperStyle={{ justifyContent: 'space-between', marginHorizontal: 16 }}
                />
            </View>
        </SafeAreaView>
    )
}

export default Menu
