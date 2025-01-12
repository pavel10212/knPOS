import { View, Text, FlatList, TouchableOpacity, Image, TextInput, Alert } from 'react-native'
import { tableStore } from '../../hooks/useStore'
import { useState, useMemo, useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'
import icons from '../../constants/icons'
import PayItem from '../../components/PayItem'
import TipButton from '../../components/TipButton'
import PaymentMethod from '../../components/PaymentMethod'
import { router } from 'expo-router'
import { useSharedStore } from '../../hooks/useSharedStore'

const Payment = () => {
    const { orderData } = useLocalSearchParams();
    const selectedTable = tableStore((state) => state.selectedTable)
    const updateSelectedTableOrders = tableStore((state) => state.updateSelectedTableOrders)
    const updateTableStatus = tableStore((state) => state.updateTableStatus)
    const clearTable = tableStore((state) => state.clearTable)
    const addPaymentHistory = tableStore((state) => state.addPaymentHistory)
    const menu = useSharedStore((state) => state.menu)

    const [selectedMethod, setSelectedMethod] = useState(null);
    const [tipPercentage, setTipPercentage] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [cashReceived, setCashReceived] = useState(0);
    const parsedOrder = JSON.parse(orderData)

    const transformedOrder = parsedOrder[0].orderDetails?.map(item => {
        const menuItem = menu?.menuItems?.find(mi => mi.menu_item_id === item.menu_item_id);
        return {
            id: item.menu_item_id,
            name: menuItem?.menu_item_name || `Unknown Item #${item.menu_item_id}`,
            quantity: item.quantity,
            price: menuItem?.price || 0
        }
    })
    console.log(transformedOrder, "new")

    if (!selectedTable) {
        return (
            <View className="flex-1 justify-center items-center">
                <Text>Please select a table first</Text>
            </View>
        );
    }

    const [orderItems, setOrderItems] = useState(transformedOrder)

    const calculations = useMemo(() => {
        const subtotal = orderItems?.reduce((sum, item) =>
            sum + (item.price * item.quantity), 0) || 0;

        return {
            subtotal,
            tip: subtotal * (tipPercentage / 100),
            serviceCharge: 0,
            discountAmount: subtotal * (discount / 100),
            vat: subtotal * 0.1,
            get total() {
                return this.subtotal + this.tip + this.serviceCharge - this.discountAmount + this.vat;
            }
        };
    }, [orderItems, tipPercentage, discount]);

    const finishPayment = () => {
        if (!selectedMethod) {
            Alert.alert('Error', 'Please select a payment method');
            return;
        }

        if (selectedMethod === 'cash' && cashReceived < total) {
            Alert.alert('Error', 'Insufficient cash received');
            return;
        }

        const paymentDetails = {
            tableNumber: selectedTable.number,
            orders: [...selectedTable.orders],
            payment: {
                method: selectedMethod,
                subtotal,
                tip,
                serviceCharge,
                discount,
                vat,
                total,
                cashReceived: selectedMethod === 'cash' ? cashReceived : total,
                timestamp: new Date().toISOString()
            }
        };

        addPaymentHistory(paymentDetails);
        clearTable(selectedTable.number);
        router.push('/home');
    }

    const deleteItem = (item) => {
        setOrderItems(orderItems.filter(i => i.id !== item.id));
    }

    const addItem = (item) => {
        setOrderItems(orderItems.map(i =>
            i.id === item.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
        ));
    }

    const subtractItem = (item) => {
        if (item.quantity <= 1) return;
        setOrderItems(orderItems.map(i =>
            i.id === item.id
                ? { ...i, quantity: i.quantity - 1 }
                : i
        ));
    }


    const { subtotal, tip, serviceCharge, discountAmount, vat, total } = calculations;

    return (
        <View className='flex-1 bg-white'>
            <View className='flex flex-row flex-1'>
                {/* Left side - Order Items */}
                <View className='flex-1'>
                    <View className='p-4 justify-between flex flex-row'>
                        <Text className='text-2xl font-bold'>Order Details</Text>
                        <Text className='text-gray-500'>Table {selectedTable?.number}</Text>
                    </View>
                    <View className='flex-1 m-5 rounded-lg'>
                        <View className='flex flex-row justify-between rounded-t-lg p-4 bg-[#EAF0F0]'>
                            <Text className='font-semibold w-[30%]'>Item</Text>
                            <Text className='font-semibold w-[15%] text-center'>Price</Text>
                            <Text className='font-semibold w-[25%] text-center'>Quantity</Text>
                            <Text className='font-semibold w-[15%] text-right'>Subtotal</Text>
                            <Text className='font-semibold w-[15%] text-center'>Actions</Text>
                        </View>
                        <FlatList
                            data={orderItems}
                            renderItem={({ item }) => <PayItem
                                addItem={addItem}
                                subtractItem={subtractItem}
                                deleteItem={deleteItem}
                                item={item} />}
                            keyExtractor={(item) => item.id.toString()}
                        />
                    </View>
                </View>

                {/* Right side - Payment Options */}
                <View className='w-[450px] relative'>
                    <View className='p-4 pb-20'>
                        <View className='mb-4'>
                            <Text className='text-2xl font-semibold mb-4'>Payable Amount</Text>
                            <Text className='text-xl font-medium text-[#D89F65]'>${total.toFixed(2)}</Text>

                            {/* Tip Section */}
                            <View className='border-t border-dashed mt-4' />
                            <View className='mt-4 flex flex-row items-center justify-start gap-4'>
                                <Text className='font-semibold'>Add Tip</Text>
                                <TipButton
                                    percentage={0}
                                    selected={tipPercentage === 0}
                                    onSelect={setTipPercentage}
                                    text="No Tip"
                                />
                                {[5, 10, 15, 20].map(percentage => (
                                    <TipButton
                                        key={percentage}
                                        percentage={percentage}
                                        selected={tipPercentage === percentage}
                                        onSelect={setTipPercentage}
                                    />
                                ))}
                            </View>

                            {/* Payment Methods */}
                            <View className='border-t border-dashed mt-4' />
                            <View className='mt-4 flex flex-row items-center justify-center gap-4'>
                                <PaymentMethod
                                    method="Cash"
                                    icon={icons.money}
                                    selected={selectedMethod === 'cash'}
                                    onSelect={() => setSelectedMethod('cash')}
                                />
                                <PaymentMethod
                                    method="QR"
                                    icon={icons.creditcard}
                                    selected={selectedMethod === 'qr'}
                                    onSelect={() => setSelectedMethod('qr')}
                                />
                            </View>

                            {/* Input Fields */}
                            <View className='mt-4 space-y-0'>
                                <View className='w-full flex flex-row h-[70px] items-center bg-[#EAF0F0] p-4 rounded-lg'>
                                    <Text>Add Discount (%)</Text>
                                    <TextInput
                                        className='border-b text-center rounded-lg w-[100px] ml-auto'
                                        placeholder='0%'
                                        value={discount.toString()}
                                        onChangeText={(text) => setDiscount(parseFloat(text) || 0)}
                                        keyboardType="numeric"
                                    />
                                </View>
                                {selectedMethod === 'cash' && (
                                    <View className='w-full flex flex-row h-[70px] items-center bg-[#EAF0F0] p-4 rounded-lg mt-2'>
                                        <Text>Cash Received</Text>
                                        <TextInput
                                            className='border-b text-center rounded-lg w-[100px] ml-auto'
                                            placeholder='$0.00'
                                            value={cashReceived.toString()}
                                            onChangeText={(text) => setCashReceived(parseFloat(text) || 0)}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                )}
                            </View>

                            {/* Summary */}
                            <View className='mt-2'>
                                {[
                                    { label: 'Subtotal', value: subtotal },
                                    { label: `Tips (${tipPercentage}%)`, value: tip },
                                    { label: 'Service Charge', value: serviceCharge },
                                    { label: `Discount (${discount}%)`, value: -discountAmount, isNegative: true },
                                    { label: 'VAT (10%)', value: vat },
                                ].map(({ label, value, isNegative }) => (
                                    <View key={label} className='flex flex-row justify-between'>
                                        <Text className='text-gray-600 text-sm'>{label}</Text>
                                        <Text className={`font-medium text-sm ${isNegative ? 'text-red-500' : ''}`}>
                                            {isNegative ? '-' : ''}${Math.abs(value).toFixed(2)}
                                        </Text>
                                    </View>
                                ))}
                                <View className='flex flex-row justify-between pt-1 border-t border-dashed'>
                                    <Text className='font-bold'>Total</Text>
                                    <Text className='font-bold text-[#D89F65]'>${total.toFixed(2)}</Text>
                                </View>
                                {selectedMethod === 'cash' && cashReceived > 0 && (
                                    <View className='flex flex-row justify-between pt-1 border-t border-dashed'>
                                        <Text className={`font-bold ${cashReceived > total ? 'text-green-500' : 'text-red-500'}`}>
                                            Change
                                        </Text>
                                        <Text className={`${cashReceived > total ? 'text-green-500' : 'text-red-500'}`}>
                                            ${Math.abs(cashReceived - total).toFixed(2)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View className='absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200'>
                        <TouchableOpacity
                            onPress={() => finishPayment()}
                            className='bg-primary p-4 rounded-lg'>
                            <Text className='text-white text-center font-bold text-lg'>
                                Complete
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default Payment;