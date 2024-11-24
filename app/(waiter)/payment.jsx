import { View, Text, FlatList, TouchableOpacity, Image, TextInput } from 'react-native'
import { tableStore } from '../../hooks/useStore'
import { useState, useMemo } from 'react'
import icons from '../../constants/icons'
import PayItem from '../../components/PayItem'
import TipButton from '../../components/TipButton'
import PaymentMethod from '../../components/PaymentMethod'


const Payment = () => {
    const { selectedTable } = tableStore();
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [tipPercentage, setTipPercentage] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [cashReceived, setCashReceived] = useState(0);

    const calculations = useMemo(() => {
        const subtotal = selectedTable?.orders?.reduce((sum, item) =>
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
    }, [selectedTable, tipPercentage, discount]);

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
                            <Text className='font-semibold w-[40%]'>Item</Text>
                            <Text className='font-semibold w-[20%] text-center'>Price</Text>
                            <Text className='font-semibold w-[20%] text-center'>QTY</Text>
                            <Text className='font-semibold w-[20%] text-right'>Subtotal</Text>
                        </View>
                        <FlatList
                            data={selectedTable?.orders || []}
                            renderItem={({ item }) => <PayItem item={item} />}
                            keyExtractor={(_, index) => index.toString()}
                        />
                    </View>
                </View>

                {/* Right side - Payment Options */}
                <View className='w-[450px] relative'> {/* Removed p-4 and added relative */}
                    <View className='p-4 pb-20'> {/* Added pb-20 to create space for fixed button */}
                        <View className='mb-4'> {/* Reduced margin bottom from 8 to 4 */}
                            <Text className='text-2xl font-semibold mb-4'>Payable Amount</Text>
                            <Text className='text-xl font-medium text-[#D89F65]'>${total.toFixed(2)}</Text>

                            {/* Tip Section */}
                            <View className='border-t border-dashed mt-4' />
                            <View className='mt-4 flex flex-row items-center justify-start gap-4'>
                                <Text className='font-semibold'>Add Tip</Text>
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
                        <TouchableOpacity className='bg-primary p-4 rounded-lg'>
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