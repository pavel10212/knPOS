import React from 'react';
import { Modal, Animated, View, TouchableOpacity, Text, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ReservationForm } from './ReservationForm';

export const EditReservationModal = ({
    visible,
    onClose,
    modalAnimation,
    form,
    onUpdateForm,
    formErrors,
    tables,
    checkingAvailability,
    availableTables,
    onSubmit,
    datePickers,
    isSubmitting = false, // Add isSubmitting prop with default value
}) => {
    const modalSlideY = modalAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [Dimensions.get('window').height, 0],
    });

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            statusBarTranslucent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/60">
                <Animated.View
                    style={{
                        transform: [{ translateY: modalSlideY }],
                        flex: 1,
                    }}
                    className="bg-white rounded-t-3xl mt-10 overflow-hidden"
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        className="flex-1">
                        <View className="flex-row justify-between items-center p-6 border-b border-gray-100">
                            <View>
                                <Text className="text-2xl font-bold text-gray-800">Edit Reservation</Text>
                                <Text className="text-gray-500 mt-1">Update reservation details</Text>
                            </View>
                            <TouchableOpacity
                                onPress={onClose}
                                disabled={isSubmitting}
                                className="bg-gray-100 p-2.5 rounded-full">
                                <Feather name="x" size={20} color={isSubmitting ? "#aaa" : "#666"} />
                            </TouchableOpacity>
                        </View>

                        <ReservationForm
                            form={form}
                            onUpdateForm={onUpdateForm}
                            formErrors={formErrors}
                            tables={tables}
                            checkingAvailability={checkingAvailability}
                            availableTables={availableTables}
                            datePickers={datePickers}
                            showStatus={true}
                            submitLabel="Update Reservation"
                            onSubmit={onSubmit}
                            onCancel={onClose}
                            isSubmitting={isSubmitting} // Pass the isSubmitting prop
                        />
                    </KeyboardAvoidingView>
                </Animated.View>
            </View>
        </Modal>
    );
};
