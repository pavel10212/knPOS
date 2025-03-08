import { useState, useCallback, useRef, useEffect } from "react";
import { useSharedStore } from "../../hooks/useSharedStore";
import {
    View, Text, ScrollView, TouchableOpacity, TextInput,
    ActivityIndicator, Modal, Alert, Animated, Dimensions,
    StatusBar, Platform, KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from '@expo/vector-icons';
import { format, isToday, isYesterday, isTomorrow, addDays } from 'date-fns';
import { useReservationStore } from "../../hooks/useReservationStore";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "react-native-modal-datetime-picker";


const Reservation = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDateTab, setSelectedDateTab] = useState('today');
    const [dateOptions, setDateOptions] = useState([]);
    const [showNewReservationModal, setShowNewReservationModal] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [modalAnimation] = useState(new Animated.Value(0));
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisible] = useState(false);
    const scrollViewRef = useRef(null);
    const tables = useSharedStore(state => state.tables);
    const [availableTables, setAvailableTables] = useState([]);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    const [reservationForm, setReservationForm] = useState({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        party_size: 2,
        table_id: '',
        reservation_time: new Date().toISOString(),
        end_time: '', // Changed to empty string as it's optional
        status: 'pending',
        notes: ''
    });

    // Date picker handlers
    const showDatePicker = () => setDatePickerVisible(true);
    const hideDatePicker = () => setDatePickerVisible(false);

    // End time picker handlers
    const showEndDatePicker = () => setEndDatePickerVisible(true);
    const hideEndDatePicker = () => setEndDatePickerVisible(false);

    const handleDateConfirm = (date) => {
        // Update reservation time
        setReservationForm({
            ...reservationForm,
            reservation_time: date.toISOString(),
            // Don't auto-update end_time anymore as it's optional
        });
        hideDatePicker();
    };

    const handleEndDateConfirm = (date) => {
        setReservationForm({
            ...reservationForm,
            end_time: date.toISOString(),
        });
        hideEndDatePicker();
    };

    // Clear end time function
    const clearEndTime = () => {
        setReservationForm({
            ...reservationForm,
            end_time: '',
        });
    };

    // Add a function to group reservations by time blocks
    const groupReservationsByTimeBlocks = (reservations) => {
        return reservations.reduce((groups, reservation) => {
            const hour = new Date(reservation.reservation_time).getHours();
            let timeBlock;

            if (hour < 12) timeBlock = 'Morning';
            else if (hour < 17) timeBlock = 'Afternoon';
            else timeBlock = 'Evening';

            if (!groups[timeBlock]) groups[timeBlock] = [];
            groups[timeBlock].push(reservation);
            return groups;
        }, {});
    };

    // Format date for display
    const getFormattedDateTime = (dateString) => {
        if (!dateString) return ''; // Handle empty string
        const date = new Date(dateString);
        return format(date, 'MMM dd, yyyy • h:mm a');
    };

    const {
        todayReservations,
        upcomingReservations,
        upcomingGroupedByDate,
        loading,
        error,
        fetchTodayReservations,
        fetchUpcomingReservations,
        createReservation,
        updateReservation,
        updateReservationStatus,
        deleteReservation,
        checkTableAvailability
    } = useReservationStore();

    useFocusEffect(
        useCallback(() => {
            fetchTodayReservations();
            fetchUpcomingReservations();
        }, [])
    );
    // Filter reservations based on selected date
    const getFilteredReservations = () => {
        if (selectedDateTab === 'today') {
            // Filter today's reservations by search query
            return todayReservations.filter(res =>
                res.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        } else {
            // Get reservations for the selected date and filter by search
            const dateReservations = upcomingGroupedByDate[selectedDateTab] || [];
            return dateReservations.filter(res =>
                res.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
    };


    useEffect(() => {
        const options = [];
        const today = new Date();

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateString = date.toISOString().split('T')[0];

            let label;
            if (i === 0) label = 'Today';
            else if (i === 1) label = 'Tomorrow';
            else label = format(date, 'EEE, MMM d')

            options.push({
                value: dateString,
                label,
                date
            });

        }
        setDateOptions(options);
    }, []);


    useEffect(() => {
        if (showNewReservationModal) {
            Animated.timing(modalAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(modalAnimation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [showNewReservationModal]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);

        if (isToday(date)) {
            return `Today at ${format(date, 'h:mm a')}`;
        } else if (isYesterday(date)) {
            return `Yesterday at ${format(date, 'h:mm a')}`;
        } else if (isTomorrow(date)) {
            return `Tomorrow at ${format(date, 'h:mm a')}`;
        } else if (date > new Date() && date < addDays(new Date(), 7)) {
            return format(date, 'EEEE') + ` at ${format(date, 'h:mm a')}`;
        } else {
            return format(date, 'MMM dd, yyyy • h:mm a');
        }
    };

    const filteredReservations = getFilteredReservations();

    // Rest of your grouping logic...
    const groupedReservations = filteredReservations.reduce((groups, reservation) => {
        const status = reservation.status || 'pending';
        if (!groups[status]) groups[status] = [];
        groups[status].push(reservation);
        return groups;
    }, {});

    // Define the desired order of status types
    const statusOrder = ['pending', 'confirmed', 'seated', 'completed', 'canceled'];

    const handleStatusChange = async (reservationId, newStatus) => {
        try {
            await updateReservationStatus(reservationId, newStatus);
            fetchTodayReservations(); // Refresh after update
        } catch (error) {
            Alert.alert("Error", "Failed to update reservation status");
        }
    };

    const handleDeleteReservation = async (reservationId) => {
        Alert.alert(
            "Confirm Deletion",
            "Are you sure you want to delete this reservation?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteReservation(reservationId);
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete reservation");
                        }
                    }
                }
            ]
        );
    };

    const validateForm = () => {
        const errors = {};

        if (!reservationForm.customer_name.trim())
            errors.customer_name = "Name is required";

        if (!reservationForm.customer_phone.trim())
            errors.customer_phone = "Phone number is required";

        if (!reservationForm.table_id)
            errors.table_id = "Please select a table";

        if (reservationForm.party_size <= 0)
            errors.party_size = "Party size must be at least 1";

        return errors;
    };

    const handleSubmitNewReservation = async () => {
        const errors = validateForm();
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        try {
            // Check availability one more time before submitting
            const endTime = getEndTime();
            const availability = await checkTableAvailability(
                Number(reservationForm.table_id),
                reservationForm.reservation_time,
                endTime
            );

            if (!availability.available) {
                Alert.alert(
                    "Table Not Available",
                    "This table has been booked by someone else. Please choose another table or time.",
                    [{ text: "OK" }]
                );
                // Refresh table availability
                checkAllTablesAvailability();
                return;
            }

            // If table is available, proceed with reservation
            await createReservation({
                ...reservationForm,
                party_size: Number(reservationForm.party_size),
                table_id: Number(reservationForm.table_id)
            });

            setShowNewReservationModal(false);
            setReservationForm({
                customer_name: '',
                customer_phone: '',
                customer_email: '',
                party_size: 2,
                table_id: '',
                reservation_time: new Date().toISOString(),
                end_time: '',
                status: 'pending',
                notes: ''
            });
            fetchTodayReservations();
        } catch (error) {
            Alert.alert("Error", "Failed to create reservation");
        }
    };

    const renderStatusBadge = (status) => {
        const statusStyles = {
            confirmed: { bg: 'bg-green-100', text: 'text-green-700', icon: 'check-circle' },
            pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'clock' },
            canceled: { bg: 'bg-red-100', text: 'text-red-700', icon: 'x-circle' },
            seated: { bg: 'bg-blue-100', text: 'text-blue-700', icon: 'users' },
            completed: { bg: 'bg-gray-100', text: 'text-gray-700', icon: 'check' },
        };

        const style = statusStyles[status] || statusStyles.pending;

        return (
            <View className={`px-3 py-1.5 rounded-full ${style.bg} flex-row items-center`}>
                <Feather name={style.icon} size={14} color={style.text.replace('text-', '').replace('-700', '')} className="mr-1" />
                <Text className={`${style.text} font-medium capitalize text-xs ml-0.5`}>{status}</Text>
            </View>
        );
    };

    const renderEmptyState = () => {
        const dateLabel = dateOptions.find(opt => opt.value === selectedDateTab)?.label || 'this day';

        return (
            <View className="py-20 items-center">
                <View className="bg-gray-50 rounded-full p-6 mb-2">
                    <Feather name="calendar" size={50} color="#94a3b8" />
                </View>
                <Text className="mt-5 text-gray-700 text-xl font-semibold">No reservations for {dateLabel}</Text>
                <Text className="mt-2 text-gray-500 text-center px-10">
                    {searchQuery
                        ? "Try a different search term or clear filters"
                        : `There are no reservations scheduled for ${dateLabel.toLowerCase()}`}
                </Text>
                <TouchableOpacity
                    onPress={() => setShowNewReservationModal(true)}
                    className="mt-6 bg-blue-600 px-6 py-3.5 rounded-xl flex-row items-center shadow-sm">
                    <Feather name="plus" size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">Create Reservation</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const modalSlideY = modalAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [Dimensions.get('window').height, 0],
    });

    const renderReservationCard = (reservation) => (
        <View
            key={reservation.reservation_id}
            className="bg-white border border-gray-100 rounded-xl p-5 mb-4 shadow-sm"
        >
            <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                    <View className="flex-row items-center">
                        <Text className="text-xl font-bold text-gray-800">{reservation.customer_name}</Text>
                        {renderStatusBadge(reservation.status)}
                    </View>

                    <View className="flex-row items-center mt-3 flex-wrap">
                        <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full mb-2 mr-2">
                            <Feather name="users" size={14} color="#6b7280" />
                            <Text className="text-gray-600 ml-1.5 text-sm">Party of {reservation.party_size}</Text>
                        </View>

                        <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full mb-2 mr-2">
                            <Feather name="clock" size={14} color="#6b7280" />
                            <Text className="text-gray-600 ml-1.5 text-sm">{formatDate(reservation.reservation_time)}</Text>
                        </View>

                        <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full mb-2">
                            <Feather name="map-pin" size={14} color="#6b7280" />
                            <Text className="text-gray-600 ml-1.5 text-sm">Table #{reservation.table_num || reservation.table_id}</Text>
                        </View>
                    </View>

                    {reservation.customer_phone && (
                        <View className="flex-row items-center mt-1">
                            <Feather name="phone" size={14} color="#6b7280" />
                            <Text className="text-gray-600 ml-2 text-sm">{reservation.customer_phone}</Text>
                        </View>
                    )}

                    {reservation.customer_email && (
                        <View className="flex-row items-center mt-1.5">
                            <Feather name="mail" size={14} color="#6b7280" />
                            <Text className="text-gray-600 ml-2 text-sm">{reservation.customer_email}</Text>
                        </View>
                    )}

                    {reservation.notes && (
                        <View className="mt-4 bg-amber-50 p-3.5 rounded-xl">
                            <View className="flex-row items-center mb-1">
                                <Feather name="file-text" size={14} color="#92400e" />
                                <Text className="font-medium text-amber-800 ml-1.5 text-sm">Notes</Text>
                            </View>
                            <Text className="text-amber-700 text-sm">{reservation.notes}</Text>
                        </View>
                    )}
                </View>
            </View>

            <View className="flex-row justify-end mt-4 pt-3 border-t border-gray-100">
                {reservation.status !== 'confirmed' && (
                    <TouchableOpacity
                        onPress={() => handleStatusChange(reservation.reservation_id, 'confirmed')}
                        className="mr-2 bg-green-50 px-3 py-2 rounded-lg flex-row items-center">
                        <Feather name="check" size={16} color="green" />
                        <Text className="text-green-700 font-medium ml-1.5 text-sm">Confirm</Text>
                    </TouchableOpacity>
                )}

                {reservation.status !== 'seated' && reservation.status !== 'canceled' && (
                    <TouchableOpacity
                        onPress={() => handleStatusChange(reservation.reservation_id, 'seated')}
                        className="mr-2 bg-blue-50 px-3 py-2 rounded-lg flex-row items-center">
                        <Feather name="users" size={16} color="#1d4ed8" />
                        <Text className="text-blue-700 font-medium ml-1.5 text-sm">Seat</Text>
                    </TouchableOpacity>
                )}

                {reservation.status !== 'canceled' && (
                    <TouchableOpacity
                        onPress={() => handleStatusChange(reservation.reservation_id, 'canceled')}
                        className="mr-2 bg-red-50 px-3 py-2 rounded-lg flex-row items-center">
                        <Feather name="x" size={16} color="#b91c1c" />
                        <Text className="text-red-700 font-medium ml-1.5 text-sm">Cancel</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    onPress={() => handleDeleteReservation(reservation.reservation_id)}
                    className="bg-gray-100 p-2.5 rounded-lg">
                    <Feather name="trash-2" size={16} color="#666" />
                </TouchableOpacity>
            </View>
        </View>
    );

    // Function to calculate end time if not provided
    const getEndTime = () => {
        if (reservationForm.end_time) return reservationForm.end_time;

        // Default to 2 hours after start time
        return new Date(
            new Date(reservationForm.reservation_time).getTime() + 2 * 60 * 60 * 1000
        ).toISOString();
    };

    // Function to check availability for all tables
    const checkAllTablesAvailability = async () => {
        if (!reservationForm.reservation_time) return;

        setCheckingAvailability(true);

        try {
            const endTime = getEndTime();

            // Check each table's availability
            const availabilityPromises = tables.map(table =>
                checkTableAvailability(
                    table.table_id,
                    reservationForm.reservation_time,
                    endTime
                )
                    .then(result => ({
                        ...table,
                        available: result.available,
                        conflicts: result.conflictingReservations
                    }))
            );

            const tablesWithAvailability = await Promise.all(availabilityPromises);
            setAvailableTables(tablesWithAvailability);
        } catch (error) {
            Alert.alert("Error", "Failed to check table availability");
        } finally {
            setCheckingAvailability(false);
        }
    };

    useEffect(() => {
        if (showNewReservationModal && reservationForm.reservation_time) {
            checkAllTablesAvailability();
        }
    }, [showNewReservationModal, reservationForm.reservation_time, reservationForm.end_time]);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            <View className="flex-1 ml-[115px]">
                {/* Header */}
                <View className="px-6 py-5 border-b border-gray-200 bg-white">
                    <View className="flex-row items-center justify-between mb-5">
                        <View>
                            <Text className="text-3xl font-bold text-gray-800">Reservations</Text>
                            <Text className="text-gray-500 mt-1">Manage your restaurant bookings</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowNewReservationModal(true)}
                            className="bg-blue-600 px-5 py-3 rounded-xl flex-row items-center shadow-sm">
                            <Feather name="plus" size={18} color="white" />
                            <Text className="text-white font-semibold ml-2">New Reservation</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Search */}
                    <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mt-1">
                        <Feather name="search" size={20} color="#666" />
                        <TextInput
                            placeholder="Search by name..."
                            placeholderTextColor="#9ca3af"
                            className="flex-1 ml-2 text-base text-gray-800"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery ? (
                            <TouchableOpacity
                                onPress={() => setSearchQuery('')}
                                className="bg-gray-200 rounded-full p-1.5">
                                <Feather name="x" size={16} color="#666" />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* Date Tabs - NEW COMPONENT */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mt-4 pb-1"
                    >
                        {dateOptions.map((dateOption) => (
                            <TouchableOpacity
                                key={dateOption.value}
                                onPress={() => setSelectedDateTab(dateOption.value)}
                                className={`px-4 py-2 rounded-lg mr-2 ${selectedDateTab === dateOption.value
                                    ? 'bg-blue-600'
                                    : 'bg-gray-100'
                                    }`}
                            >
                                <Text
                                    className={`font-medium ${selectedDateTab === dateOption.value
                                        ? 'text-white'
                                        : 'text-gray-700'
                                        }`}
                                >
                                    {dateOption.label}
                                </Text>

                                {/* Show reservation count badge if any exist */}
                                {upcomingGroupedByDate[dateOption.value]?.length > 0 && (
                                    <View className={`absolute -top-0 -right-1 bg-${selectedDateTab === dateOption.value ? 'white' : 'blue-600'
                                        } rounded-full min-w-[18px] h-[18px] items-center justify-center px-1`}>
                                        <Text className={`text-xs font-bold ${selectedDateTab === dateOption.value ? 'text-blue-600' : 'text-white'
                                            }`}>
                                            {upcomingGroupedByDate[dateOption.value].length}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Reservations List */}
                <ScrollView
                    className="flex-1 px-6 pt-5"
                    ref={scrollViewRef}
                    showsVerticalScrollIndicator={false}>

                    {/* Date Navigation - NEW COMPONENT */}
                    <View className="flex-row items-center justify-between mb-6">
                        <TouchableOpacity
                            onPress={() => {
                                // Find previous date tab
                                const currentIndex = dateOptions.findIndex(opt => opt.value === selectedDateTab);
                                if (currentIndex > 0) {
                                    setSelectedDateTab(dateOptions[currentIndex - 1].value);
                                }
                            }}
                            className="flex-row items-center bg-white px-3 py-2 rounded-lg border border-gray-200"
                            disabled={selectedDateTab === dateOptions[0]?.value}
                        >
                            <Feather
                                name="chevron-left"
                                size={18}
                                color={selectedDateTab === dateOptions[0]?.value ? "#d1d5db" : "#4b5563"}
                            />
                            <Text className={`ml-1 ${selectedDateTab === dateOptions[0]?.value ? "text-gray-300" : "text-gray-600"}`}>
                                Previous Day
                            </Text>
                        </TouchableOpacity>

                        <View>
                            <Text className="text-lg font-semibold text-gray-800">
                                {dateOptions.find(opt => opt.value === selectedDateTab)?.label || 'Reservations'}
                            </Text>
                            <Text className="text-center text-xs text-gray-500">
                                {upcomingGroupedByDate[selectedDateTab]?.length || 0} reservation(s)
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                // Find next date tab
                                const currentIndex = dateOptions.findIndex(opt => opt.value === selectedDateTab);
                                if (currentIndex < dateOptions.length - 1) {
                                    setSelectedDateTab(dateOptions[currentIndex + 1].value);
                                }
                            }}
                            className="flex-row items-center bg-white px-3 py-2 rounded-lg border border-gray-200"
                            disabled={selectedDateTab === dateOptions[dateOptions.length - 1]?.value}
                        >
                            <Text className={`mr-1 ${selectedDateTab === dateOptions[dateOptions.length - 1]?.value ? "text-gray-300" : "text-gray-600"}`}>
                                Next Day
                            </Text>
                            <Feather
                                name="chevron-right"
                                size={18}
                                color={selectedDateTab === dateOptions[dateOptions.length - 1]?.value ? "#d1d5db" : "#4b5563"}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Continue with your loading/error/reservations content */}
                    {loading ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator size="large" color="#3b82f6" />
                            <Text className="mt-4 text-gray-600">Loading reservations...</Text>
                        </View>
                    ) : error ? (
                        <View className="py-20 items-center">
                            <View className="bg-red-50 rounded-full p-6 mb-2">
                                <Feather name="alert-circle" size={50} color="#ef4444" />
                            </View>
                            <Text className="mt-4 text-red-500 font-semibold text-lg">Unable to load reservations</Text>
                            <Text className="mt-2 text-gray-500 text-center px-10">{error}</Text>
                            <TouchableOpacity
                                onPress={fetchTodayReservations}
                                className="mt-6 bg-blue-600 px-6 py-3 rounded-xl">
                                <Text className="text-white font-semibold">Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    ) : filteredReservations.length === 0 ? (
                        renderEmptyState()
                    ) : (
                        <View className="mb-10">
                            {/* Just use one grouping method based on the selected date */}
                            {(() => {
                                // For non-today dates, group by time blocks (Morning/Afternoon/Evening)
                                if (selectedDateTab !== 'today') {
                                    const timeBlocks = groupReservationsByTimeBlocks(filteredReservations);

                                    return Object.entries(timeBlocks).map(([timeBlock, blockReservations]) => (
                                        <View key={timeBlock} className="mb-6">
                                            <View className="flex-row items-center mb-3">
                                                <Text className="text-lg font-bold text-gray-800">{timeBlock}</Text>
                                                <View className="bg-gray-200 px-2.5 py-0.5 rounded-full ml-2">
                                                    <Text className="text-gray-700 text-xs font-medium">
                                                        {blockReservations.length}
                                                    </Text>
                                                </View>
                                            </View>
                                            {blockReservations.map(reservation => renderReservationCard(reservation))}
                                        </View>
                                    ));
                                }
                                // For today, group by status (Pending/Confirmed/etc.)
                                else {
                                    return statusOrder.map(status =>
                                        groupedReservations[status] && groupedReservations[status].length > 0 ? (
                                            <View key={status} className="mb-6">
                                                <View className="flex-row items-center mb-3">
                                                    <Text className="text-lg font-bold text-gray-800 capitalize">
                                                        {status}
                                                    </Text>
                                                    <View className="bg-gray-200 px-2.5 py-0.5 rounded-full ml-2">
                                                        <Text className="text-gray-700 text-xs font-medium">
                                                            {groupedReservations[status].length}
                                                        </Text>
                                                    </View>
                                                </View>
                                                {groupedReservations[status].map(reservation =>
                                                    renderReservationCard(reservation)
                                                )}
                                            </View>
                                        ) : null
                                    );
                                }
                            })()}
                        </View>
                    )}
                </ScrollView>

                {/* New Reservation Modal */}
                <Modal
                    visible={showNewReservationModal}
                    transparent={true}
                    animationType="none"
                    statusBarTranslucent={true}
                    onRequestClose={() => setShowNewReservationModal(false)}
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
                                        <Text className="text-2xl font-bold text-gray-800">New Reservation</Text>
                                        <Text className="text-gray-500 mt-1">Create a table booking</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setShowNewReservationModal(false)}
                                        className="bg-gray-100 p-2.5 rounded-full">
                                        <Feather name="x" size={20} color="#666" />
                                    </TouchableOpacity>
                                </View>

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
                                            value={reservationForm.customer_name}
                                            onChangeText={(text) => {
                                                setReservationForm({ ...reservationForm, customer_name: text });
                                                if (formErrors.customer_name) {
                                                    setFormErrors({ ...formErrors, customer_name: null });
                                                }
                                            }}
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
                                            value={reservationForm.customer_phone}
                                            onChangeText={(text) => {
                                                setReservationForm({ ...reservationForm, customer_phone: text });
                                                if (formErrors.customer_phone) {
                                                    setFormErrors({ ...formErrors, customer_phone: null });
                                                }
                                            }}
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
                                            value={reservationForm.customer_email}
                                            onChangeText={(text) => setReservationForm({ ...reservationForm, customer_email: text })}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
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
                                                        const isAvailable = availableTables.length === 0 || table.available;

                                                        return (
                                                            <TouchableOpacity
                                                                key={table.table_id}
                                                                className={`px-4 py-3 m-1 rounded-xl ${reservationForm.table_id === table.table_id
                                                                    ? 'bg-blue-600'
                                                                    : isAvailable ? 'bg-gray-100' : 'bg-red-50'
                                                                    } min-w-[100px] items-center`}
                                                                onPress={() => {
                                                                    if (!isAvailable) {
                                                                        // Show conflict info
                                                                        if (table.conflicts && table.conflicts.length > 0) {
                                                                            const conflict = table.conflicts[0];
                                                                            const startTime = new Date(conflict.reservation_time);
                                                                            const endTime = conflict.end_time
                                                                                ? new Date(conflict.end_time)
                                                                                : new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

                                                                            Alert.alert(
                                                                                "Table Not Available",
                                                                                `This table is already booked from ${format(startTime, 'h:mm a')} to ${format(endTime, 'h:mm a')} by ${conflict.customer_name}.`,
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

                                                                    setReservationForm({ ...reservationForm, table_id: table.table_id });
                                                                    if (formErrors.table_id) {
                                                                        setFormErrors({ ...formErrors, table_id: null });
                                                                    }
                                                                }}
                                                                disabled={!isAvailable}
                                                            >
                                                                <View className={`w-8 h-8 rounded-full ${reservationForm.table_id === table.table_id
                                                                    ? 'bg-blue-300'
                                                                    : isAvailable ? 'bg-white' : 'bg-red-100'
                                                                    } items-center justify-center mb-1`}>
                                                                    <Text className={`text-sm font-bold ${reservationForm.table_id === table.table_id
                                                                        ? 'text-blue-800'
                                                                        : isAvailable ? 'text-gray-800' : 'text-red-800'
                                                                        }`}>
                                                                        {table.table_num || table.table_id}
                                                                    </Text>
                                                                </View>

                                                                <Text className={`text-xs font-medium ${reservationForm.table_id === table.table_id
                                                                    ? 'text-white'
                                                                    : isAvailable ? 'text-gray-700' : 'text-red-700'
                                                                    }`}>
                                                                    Table {table.table_num || table.table_id}
                                                                </Text>

                                                                {table.capacity && (
                                                                    <Text className={`text-xs ${reservationForm.table_id === table.table_id
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
                                            {formErrors.table_id && (
                                                <Text className="text-red-500 text-xs mt-1 ml-1">{formErrors.table_id}</Text>
                                            )}
                                        </View>
                                    </View>

                                    {availableTables.length > 0 && (
                                        <View className="mb-4 px-2">
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

                                    <View className="mb-5">
                                        <Text className="text-gray-700 font-medium mb-1.5 text-sm">Party Size *</Text>
                                        <TextInput
                                            placeholder="Enter number of guests"
                                            placeholderTextColor="#9ca3af"
                                            className={`border ${formErrors.party_size ? 'border-red-400' : 'border-gray-300'} rounded-xl px-4 py-3.5 bg-white text-gray-800`}
                                            value={reservationForm.party_size.toString()}
                                            onChangeText={(text) => {
                                                setReservationForm({ ...reservationForm, party_size: text });
                                                if (formErrors.party_size) {
                                                    setFormErrors({ ...formErrors, party_size: null });
                                                }
                                            }}
                                            keyboardType="number-pad"
                                        />
                                        {formErrors.party_size && (
                                            <Text className="text-red-500 text-xs mt-1 ml-1">{formErrors.party_size}</Text>
                                        )}
                                    </View>

                                    <View className="mb-5">
                                        <Text className="text-gray-700 font-medium mb-1.5 text-sm">Reservation Time *</Text>
                                        <TouchableOpacity
                                            onPress={showDatePicker}
                                            className="border border-gray-300 rounded-xl px-4 py-3.5 bg-white flex-row items-center justify-between"
                                        >
                                            <Text className="text-gray-800">
                                                {getFormattedDateTime(reservationForm.reservation_time)}
                                            </Text>
                                            <Feather name="calendar" size={20} color="#4b5563" />
                                        </TouchableOpacity>
                                    </View>

                                    <View className="mb-5">
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-gray-700 font-medium mb-1.5 text-sm">End Time <Text className="text-gray-400 font-normal">(optional)</Text></Text>
                                            {reservationForm.end_time && (
                                                <TouchableOpacity
                                                    onPress={clearEndTime}
                                                    className="mb-1.5 px-2 py-1 bg-gray-100 rounded-md"
                                                >
                                                    <Text className="text-gray-600 text-xs">Clear</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        <TouchableOpacity
                                            onPress={showEndDatePicker}
                                            className="border border-gray-300 rounded-xl px-4 py-3.5 bg-white flex-row items-center justify-between"
                                        >
                                            <Text className={reservationForm.end_time ? "text-gray-800" : "text-gray-400"}>
                                                {reservationForm.end_time
                                                    ? getFormattedDateTime(reservationForm.end_time)
                                                    : "Set end time (optional)"}
                                            </Text>
                                            <Feather name="clock" size={20} color="#4b5563" />
                                        </TouchableOpacity>
                                        <Text className="text-xs text-gray-500 mt-2">
                                            Leave blank if you don't want to specify an end time
                                        </Text>
                                    </View>

                                    <View className="mb-5">
                                        <Text className="text-gray-700 font-medium mb-1.5 text-sm">Notes (optional)</Text>
                                        <TextInput
                                            placeholder="Add any special requests or notes"
                                            placeholderTextColor="#9ca3af"
                                            className="border border-gray-300 rounded-xl px-4 py-3.5 bg-white text-gray-800"
                                            value={reservationForm.notes}
                                            onChangeText={(text) => setReservationForm({ ...reservationForm, notes: text })}
                                            multiline={true}
                                            numberOfLines={3}
                                            textAlignVertical="top"
                                            style={{ height: 100 }}
                                        />
                                    </View>
                                </ScrollView>

                                <View className="flex-row justify-end border-t border-gray-100 pt-4 px-6 pb-6">
                                    <TouchableOpacity
                                        onPress={() => setShowNewReservationModal(false)}
                                        className="bg-gray-100 px-5 py-3 rounded-xl mr-3"
                                    >
                                        <Text className="font-medium text-gray-700">Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={handleSubmitNewReservation}
                                        className="bg-blue-600 px-5 py-3 rounded-xl"
                                    >
                                        <Text className="text-white font-semibold">Create Reservation</Text>
                                    </TouchableOpacity>
                                </View>
                            </KeyboardAvoidingView>
                        </Animated.View>
                    </View>
                </Modal>
            </View>

            {/* Date Time Picker */}
            <DateTimePicker
                isVisible={isDatePickerVisible}
                mode="datetime"
                date={new Date(reservationForm.reservation_time)}
                onConfirm={handleDateConfirm}
                onCancel={hideDatePicker}
                minimumDate={new Date()}
            />

            <DateTimePicker
                isVisible={isEndDatePickerVisible}
                mode="datetime"
                date={reservationForm.end_time ? new Date(reservationForm.end_time) : new Date(new Date(reservationForm.reservation_time).getTime() + 2 * 60 * 60 * 1000)}
                onConfirm={handleEndDateConfirm}
                onCancel={hideEndDatePicker}
                minimumDate={new Date(reservationForm.reservation_time)}
            />
        </SafeAreaView>
    );
};

export default Reservation;