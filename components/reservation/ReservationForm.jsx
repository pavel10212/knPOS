import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';

export const ReservationForm = ({
    form,
    onUpdateForm,
    formErrors,
    tables,
    checkingAvailability,
    availableTables,
    datePickers,
    showStatus,
    submitLabel,
    onSubmit,
    onCancel,
}) => {
    const getFormattedDateTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return format(date, 'MMM dd, yyyy • h:mm a');
    };

    return (
        <>
            <ScrollView
                className="flex-1 p-6"
                showsVerticalScrollIndicator={false}
                bounces={false}>
                <View className="mb-5">
                    <Text className="text-gray-700 font-medium mb-1.5 text-sm">Customer Name *</Text>
                    <TextInput
                        placeholder="Enter customer name"
                        placeholderTextColor="#9ca3af"
                        className={`border ${formErrors.customer_name ? 'border-red-400' : 'border-gray-300'} rounded-xl px-4 py-3.5 bg-white text-gray-800`}
                        value={form.customer_name}
                        onChangeText={(text) => onUpdateForm({ ...form, customer_name: text })}
                    />
                    {formErrors.customer_name && (
                        <Text className="text-red-500 text-xs mt-1 ml-1">{formErrors.customer_name}</Text>
                    )}
                </View>

                <View className="mb-5">
                    <Text className="text-gray-700 font-medium mb-1.5 text-sm">Phone Number *</Text>
                    <TextInput
                        placeholder="Enter phone number"
                        placeholderTextColor="#9ca3af"
                        className={`border ${formErrors.customer_phone ? 'border-red-400' : 'border-gray-300'} rounded-xl px-4 py-3.5 bg-white text-gray-800`}
                        value={form.customer_phone}
                        onChangeText={(text) => onUpdateForm({ ...form, customer_phone: text })}
                        keyboardType="phone-pad"
                    />
                    {formErrors.customer_phone && (
                        <Text className="text-red-500 text-xs mt-1 ml-1">{formErrors.customer_phone}</Text>
                    )}
                </View>

                <View className="mb-5">
                    <Text className="text-gray-700 font-medium mb-1.5 text-sm">Email (optional)</Text>
                    <TextInput
                        placeholder="Enter email address"
                        placeholderTextColor="#9ca3af"
                        className="border border-gray-300 rounded-xl px-4 py-3.5 bg-white text-gray-800"
                        value={form.customer_email}
                        onChangeText={(text) => onUpdateForm({ ...form, customer_email: text })}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>


                <View className="mb-5">
                    <Text className="text-gray-700 font-medium mb-1.5 text-sm">Party Size *</Text>
                    <TextInput
                        placeholder="Enter number of guests"
                        placeholderTextColor="#9ca3af"
                        className={`border ${formErrors.party_size ? 'border-red-400' : 'border-gray-300'} rounded-xl px-4 py-3.5 bg-white text-gray-800`}
                        value={String(form.party_size)}
                        onChangeText={(text) => onUpdateForm({ ...form, party_size: text })}
                        keyboardType="number-pad"
                    />
                    {formErrors.party_size && (
                        <Text className="text-red-500 text-xs mt-1 ml-1">{formErrors.party_size}</Text>
                    )}
                </View>

                <View className="mb-5">
                    <Text className="text-gray-700 font-medium mb-1.5 text-sm">Reservation Time *</Text>
                    <TouchableOpacity
                        onPress={datePickers.showDatePicker}
                        className="border border-gray-300 rounded-xl px-4 py-3.5 bg-white flex-row items-center justify-between">
                        <Text className="text-gray-800">{getFormattedDateTime(form.reservation_time)}</Text>
                        <Feather name="calendar" size={20} color="#4b5563" />
                    </TouchableOpacity>
                </View>

                <View className="mb-5">
                    <View className="flex-row items-center justify-between">
                        <Text className="text-gray-700 font-medium mb-1.5 text-sm">End Time <Text className="text-gray-400 font-normal">(optional)</Text></Text>
                        {form.end_time && (
                            <TouchableOpacity
                                onPress={datePickers.clearEndTime}
                                className="mb-1.5 px-2 py-1 bg-gray-100 rounded-md">
                                <Text className="text-gray-600 text-xs">Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={datePickers.showEndDatePicker}
                        className="border border-gray-300 rounded-xl px-4 py-3.5 bg-white flex-row items-center justify-between">
                        <Text className={form.end_time ? "text-gray-800" : "text-gray-400"}>
                            {form.end_time ? getFormattedDateTime(form.end_time) : "Set end time (optional)"}
                        </Text>
                        <Feather name="clock" size={20} color="#4b5563" />
                    </TouchableOpacity>
                </View>
                <View className="mb-5">
                    <Text className='text-gray-700 font-medium mb-1.5 text-sm'>Select Table *</Text>
                    <View className={`border ${formErrors.table_id ? 'border-red-400' : 'border-gray-300'} rounded-xl bg-white p-3`}>
                        {checkingAvailability ? (
                            <View className="flex-row items-center justify-center py-6">
                                <ActivityIndicator size="small" color="#3b82f6" />
                                <Text className="ml-3 text-gray-600">Checking availability...</Text>
                            </View>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 5 }}
                                className="flex-row"
                            >
                                {(availableTables.length > 0 ? availableTables : tables).map((table) => {
                                    const isAvailable = availableTables.length === 0 ||
                                        table.available ||
                                        String(table.table_id) === String(form.table_id);
                                    
                                    const isSelected = String(table.table_id) === String(form.table_id);

                                    return (
                                        <TouchableOpacity
                                            key={table.table_id}
                                            className={`px-4 py-3 m-1 rounded-xl ${isSelected
                                                    ? 'bg-blue-600'
                                                    : isAvailable ? 'bg-gray-100' : 'bg-red-50'
                                                } min-w-[100px] items-center`}
                                            onPress={() => {
                                                if (!isAvailable) {
                                                    // Show conflict information if available
                                                    if (table.conflicts && table.conflicts.length > 0) {
                                                        const conflict = table.conflicts[0];
                                                        const startTime = new Date(conflict.reservation_time);
                                                        const endTime = conflict.end_time
                                                            ? new Date(conflict.end_time)
                                                            : new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

                                                        // Format the times
                                                        const startFormatted = format(startTime, 'h:mm a');
                                                        const endFormatted = format(endTime, 'h:mm a');

                                                        Alert.alert(
                                                            "Table Not Available",
                                                            `This table is already booked from ${startFormatted} to ${endFormatted} by ${conflict.customer_name}.`,
                                                            [{ text: "OK" }]
                                                        );
                                                    } else {
                                                        Alert.alert(
                                                            "Table Not Available",
                                                            "This table is already booked during the selected time.",
                                                            [{ text: "OK" }]
                                                        );
                                                    }
                                                    return;
                                                }

                                                onUpdateForm({ ...form, table_id: table.table_id });
                                            }}
                                            disabled={!isAvailable}
                                        >
                                            <View className={`w-8 h-8 rounded-full ${isSelected
                                                    ? 'bg-blue-300'
                                                    : isAvailable ? 'bg-white' : 'bg-red-100'
                                                } items-center justify-center mb-1`}>
                                                <Text className={`text-sm font-bold ${isSelected
                                                        ? 'text-blue-800'
                                                        : isAvailable ? 'text-gray-800' : 'text-red-800'
                                                    }`}>
                                                    {table.table_num || table.table_id}
                                                </Text>
                                            </View>

                                            <Text className={`text-xs font-medium ${isSelected
                                                    ? 'text-white'
                                                    : isAvailable ? 'text-gray-700' : 'text-red-700'
                                                }`}>
                                                Table {table.table_num || table.table_id}
                                            </Text>

                                            {table.capacity && (
                                                <Text className={`text-xs ${isSelected
                                                        ? 'text-blue-200'
                                                        : isAvailable ? 'text-gray-500' : 'text-red-300'
                                                    } mt-0.5`}>
                                                    {table.capacity} {table.capacity === 1 ? 'person' : 'people'}
                                                </Text>
                                            )}

                                            {!isAvailable && (
                                                <Text className="text-xs text-red-500 mt-1">Unavailable</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                    {formErrors.table_id && (
                        <Text className="text-red-500 text-xs mt-1 ml-1">{formErrors.table_id}</Text>
                    )}
                </View>

                {availableTables.length > 0 && (
                    <View className="mb-4 px-2 mt-2">
                        <View className="flex-row items-center mb-1">
                            <View className="w-3 h-3 rounded-full bg-gray-100 mr-2" />
                            <Text className="text-xs text-gray-600">Available for selected time</Text>
                        </View>
                        <View className="flex-row items-center">
                            <View className="w-3 h-3 rounded-full bg-red-50 mr-2" />
                            <Text className="text-xs text-gray-600">Not available (already booked)</Text>
                        </View>
                    </View>
                )}

                {showStatus && (
                    <View className="mb-5">
                        <Text className="text-gray-700 font-medium mb-1.5 text-sm">Status</Text>
                        <View className="flex-row flex-wrap">
                            {['pending', 'confirmed', 'seated', 'completed', 'canceled'].map(status => (
                                <TouchableOpacity
                                    key={status}
                                    onPress={() => onUpdateForm({ ...form, status })}
                                    className={`px-4 py-2.5 rounded-lg mr-2 mb-2 ${form.status === status ? 'bg-blue-100 border border-blue-300' : 'bg-gray-100'}`}>
                                    <Text className={`${form.status === status ? 'text-blue-800' : 'text-gray-700'} capitalize`}>{status}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <View className="mb-5">
                    <Text className="text-gray-700 font-medium mb-1.5 text-sm">Notes (optional)</Text>
                    <TextInput
                        placeholder="Add any special requests or notes"
                        placeholderTextColor="#9ca3af"
                        className="border border-gray-300 rounded-xl px-4 py-3.5 bg-white text-gray-800"
                        value={form.notes}
                        onChangeText={(text) => onUpdateForm({ ...form, notes: text })}
                        multiline={true}
                        numberOfLines={3}
                        textAlignVertical="top"
                        style={{ height: 100 }}
                    />
                </View>
            </ScrollView>

            <View className="flex-row justify-end border-t border-gray-100 pt-4 px-6 pb-6">
                <TouchableOpacity
                    onPress={onCancel}
                    className="bg-gray-100 px-5 py-3 rounded-xl mr-3">
                    <Text className="font-medium text-gray-700">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={onSubmit}
                    className="bg-blue-600 px-5 py-3 rounded-xl">
                    <Text className="text-white font-semibold">{submitLabel}</Text>
                </TouchableOpacity>
            </View>
        </>
    );
};
