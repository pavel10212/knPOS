import { useState, useCallback, useRef, useEffect } from "react";
import { useSharedStore } from "../../hooks/useSharedStore";
import {
    View, Text, ScrollView, ActivityIndicator, Alert, Switch,
    Animated, StatusBar, TouchableOpacity
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from '@expo/vector-icons';
import { useReservationStore } from "../../hooks/useReservationStore";
import { useFocusEffect } from "@react-navigation/native";
import DateTimePicker from "react-native-modal-datetime-picker";
import { ReservationHeader } from '../../components/reservation/ReservationHeader';
import { DateNavigation } from '../../components/reservation/DateNavigation';
import ReservationList from "../../components/reservation/ReservationList";
import { NewReservationModal } from '../../components/reservation/NewReservationModal';
import { EditReservationModal } from '../../components/reservation/EditReservationModal';
import { EmptyState } from '../../components/reservation/EmptyState';
import { formatDate } from '../../utils/reservationUtils';
import { format } from 'date-fns';
import { tableStore } from "../../hooks/useStore";
import { useLocalSearchParams, router } from 'expo-router';

const Reservation = () => {
    // Get URL parameters
    const params = useLocalSearchParams();

    // Ref to track if we've already processed the URL params
    const paramsProcessedRef = useRef({
        createNew: false,
        viewReservation: false
    });

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
    const orders = useSharedStore(state => state.orders);
    const selectTable = tableStore((state) => state.selectTable);
    const [availableTables, setAvailableTables] = useState([]);
    const [checkingAvailability, setCheckingAvailability] = useState(false);

    const [reservationForm, setReservationForm] = useState({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        party_size: 2,
        table_id: params?.selectedTableId || '',
        reservation_time: new Date().toISOString(),
        end_time: '',
        status: 'pending',
        notes: ''
    });
    const [showEditReservationModal, setShowEditReservationModal] = useState(false);
    const [editReservationForm, setEditReservationForm] = useState({
        reservation_id: '',
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
    const [editFormErrors, setEditFormErrors] = useState({});
    const [editModalAnimation] = useState(new Animated.Value(0));
    const [showPastReservations, setShowPastReservations] = useState(false);

    // Add state for tracking form submission
    const [isSubmittingNew, setIsSubmittingNew] = useState(false);
    const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

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

    // Date picker handlers for edit form
    const [isEditDatePickerVisible, setEditDatePickerVisible] = useState(false);
    const [isEditEndDatePickerVisible, setEditEndDatePickerVisible] = useState(false);

    const showEditDatePicker = () => setEditDatePickerVisible(true);
    const hideEditDatePicker = () => setEditDatePickerVisible(false);
    const showEditEndDatePicker = () => setEditEndDatePickerVisible(true);
    const hideEditEndDatePicker = () => setEditEndDatePickerVisible(false);

    const handleEditDateConfirm = (date) => {
        setEditReservationForm({
            ...editReservationForm,
            reservation_time: date.toISOString(),
        });
        hideEditDatePicker();
    };

    const handleEditEndDateConfirm = (date) => {
        setEditReservationForm({
            ...editReservationForm,
            end_time: date.toISOString(),
        });
        hideEditEndDatePicker();
    };

    const clearEditEndTime = () => {
        setEditReservationForm({
            ...editReservationForm,
            end_time: '',
        });
    };

    const {
        todayReservations,
        upcomingGroupedByDate,
        loading,
        error,
        fetchTodayReservations,
        fetchAllReservationData,
        createReservation,
        updateReservation, // Add this line to import the updateReservation function
        updateReservationStatus,
        deleteReservation } = useReservationStore();

    useFocusEffect(
        useCallback(() => {
            fetchAllReservationData();
        }, [fetchAllReservationData])
    );
    // Filter reservations based on selected date
    const getFilteredReservations = () => {
        let result = [];

        if (selectedDateTab === 'today') {
            // Filter today's reservations
            result = todayReservations.filter(res =>
                res.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        } else {
            // Get reservations for the selected date
            const dateReservations = upcomingGroupedByDate[selectedDateTab] || [];
            result = dateReservations.filter(res =>
                res.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply past reservation filter if needed
        if (!showPastReservations) {
            result = result.filter(res => !['completed', 'canceled'].includes(res.status));
        }

        return result;
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

    const handleEditReservation = (reservation) => {
        // Clone the reservation to avoid direct state mutation
        const reservationData = { ...reservation };

        // Initialize the edit form with selected reservation data
        setEditReservationForm({
            reservation_id: reservationData.reservation_id,
            customer_name: reservationData.customer_name || '',
            customer_phone: reservationData.customer_phone || '',
            customer_email: reservationData.customer_email || '',
            party_size: reservationData.party_size || 2,
            table_id: reservationData.table_id,
            reservation_time: reservationData.reservation_time || new Date().toISOString(),
            end_time: reservationData.end_time || '',
            status: reservationData.status || 'pending', // Important: preserve the original status
            notes: reservationData.notes || ''
        });

        // Reset form errors
        setEditFormErrors({});

        // Show the modal
        setShowEditReservationModal(true);

        // Check table availability for this reservation 
        checkAllTablesAvailabilityForEdit(reservationData.reservation_id);
    };

    // Add this effect to animate the edit modal
    useEffect(() => {
        if (showEditReservationModal) {
            Animated.timing(editModalAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(editModalAnimation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [showEditReservationModal]);

    // Animation value for the edit modal slide

    useEffect(() => {
        if (showNewReservationModal) {
            Animated.timing(modalAnimation, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false, // Change to false to prevent excessive renders
            }).start();
        } else {
            Animated.timing(modalAnimation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false, // Change to false to prevent excessive renders
            }).start();
        }
    }, [showNewReservationModal]);

    const checkAllTablesAvailabilityForEdit = (reservationId) => {
        if (!editReservationForm.reservation_time) return;

        setCheckingAvailability(true);

        try {
            const endTime = getEndTimeForEdit();

            const tablesWithAvailability = tables.map(table => {
                const result = useReservationStore.getState().checkTableAvailabilityLocal(
                    table.table_id,
                    editReservationForm.reservation_time,
                    endTime,
                    reservationId,
                    30 // 30 minute buffer
                );

                return {
                    ...table,
                    available: result.available,
                    conflicts: result.conflictingReservations
                };
            });

            setAvailableTables(tablesWithAvailability);
        } catch (error) {
            Alert.alert("Error", "Failed to check table availability");
        } finally {
            setCheckingAvailability(false);
        }
    };

    // Function to calculate end time for the edit form
    const getEndTimeForEdit = () => {
        if (editReservationForm.end_time) return editReservationForm.end_time;

        // Default to 2 hours after start time
        return new Date(
            new Date(editReservationForm.reservation_time).getTime() + 2 * 60 * 60 * 1000
        ).toISOString();
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
            // First, get the reservation details to access table information
            const allReservations = [...todayReservations];
            Object.values(upcomingGroupedByDate).forEach(dateReservations => {
                allReservations.push(...dateReservations);
            });

            const reservation = allReservations.find(r => r.reservation_id === reservationId);
            if (!reservation) {
                throw new Error("Reservation not found");
            }

            const tableId = reservation.table_id;
            const tableNum = tables.find(t => t.table_id === tableId)?.table_num || tableId;

            // Special handling for 'completed' status - always route through payment
            if (newStatus === 'completed') {
                // Always select the table and navigate to payment
                const activeOrders = orders.filter(
                    order => String(order.table_num) === String(tableNum) && order.order_status !== 'Completed'
                );

                // Select the table
                selectTable({
                    table_num: tableNum,
                    orders: activeOrders,
                    status: 'Unavailable',
                });

                // If there are no active orders, show a message
                if (activeOrders.length === 0) {
                    Alert.alert(
                        "No Active Orders",
                        "This table has no active orders. You will be redirected to the payment page to complete the process.",
                        [{ text: "OK" }]
                    );
                }

                // Navigate to payment page
                router.push('/payment');
                return;
            }

            // Update reservation status for other statuses
            await updateReservationStatus(reservationId, newStatus);

            // Then update table status based on the new reservation status
            if (newStatus === 'canceled') {
                // When canceled, mark table as Available
                console.log(`Marking table ${tableNum} as Available after canceling reservation`);
                try {
                    await tableStore.getState().updateTableStatus(tableNum, 'Available');
                } catch (tableError) {
                    console.error("Error updating table status:", tableError);
                    Alert.alert("Warning", `Reservation marked as ${newStatus}, but failed to update table status to Available`);
                }
            } else if (newStatus === 'seated') {
                // When seated, mark table as Unavailable (occupied)
                console.log(`Marking table ${tableNum} as Unavailable after seating reservation`);
                try {
                    await tableStore.getState().updateTableStatus(tableNum, 'Unavailable');
                } catch (tableError) {
                    console.error("Error updating table status:", tableError);
                    Alert.alert("Warning", `Reservation marked as seated, but failed to update table status to Unavailable`);
                }
            }

            // Refresh the reservation data
            fetchTodayReservations();
        } catch (error) {
            console.error("Error in handleStatusChange:", error);
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
                            // First, get the reservation details to access table information
                            const allReservations = [...todayReservations];
                            Object.values(upcomingGroupedByDate).forEach(dateReservations => {
                                allReservations.push(...dateReservations);
                            });

                            const reservation = allReservations.find(r => r.reservation_id === reservationId);
                            if (!reservation) {
                                throw new Error("Reservation not found");
                            }

                            const tableId = reservation.table_id;
                            const tableNum = tables.find(t => t.table_id === tableId)?.table_num || tableId;

                            // Delete the reservation
                            await deleteReservation(reservationId);

                            // After deletion, check if there are other active reservations for this table
                            const otherReservationsForTable = allReservations.filter(r =>
                                r.reservation_id !== reservationId &&
                                r.table_id === tableId &&
                                !['completed', 'canceled'].includes(r.status)
                            );

                            if (otherReservationsForTable.length === 0) {
                                // No other active reservations, mark the table as Available
                                console.log(`No other active reservations for table ${tableNum}, marking as Available after deletion`);
                                try {
                                    await tableStore.getState().updateTableStatus(tableNum, 'Available');
                                    console.log(`✅ Table ${tableNum} marked as Available after reservation deleted`);
                                } catch (error) {
                                    console.error(`❌ Failed to mark table ${tableNum} as Available:`, error);
                                    Alert.alert("Warning", "Reservation deleted, but failed to update table status");
                                }
                            } else {
                                console.log(`Table ${tableNum} still has ${otherReservationsForTable.length} active reservations - keeping status`);
                            }

                            // Refresh reservation data
                            fetchTodayReservations();
                        } catch (error) {
                            console.error("Error deleting reservation:", error);
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

    // Add validateEditForm function to handle edit form validation
    const validateEditForm = () => {
        const errors = {};

        if (!editReservationForm.customer_name.trim())
            errors.customer_name = "Name is required";

        if (!editReservationForm.customer_phone.trim())
            errors.customer_phone = "Phone number is required";

        if (!editReservationForm.table_id)
            errors.table_id = "Please select a table";

        if (editReservationForm.party_size <= 0)
            errors.party_size = "Party size must be at least 1";

        return errors;
    };

    const handleUpdateReservation = async () => {
        const errors = validateEditForm();
        setEditFormErrors(errors);

        if (Object.keys(errors).length > 0) return;

        // Set loading state to true
        setIsSubmittingEdit(true);

        try {
            // Ensure table is selected
            if (!editReservationForm.table_id) {
                setEditFormErrors(prev => ({ ...prev, table_id: "Please select a table" }));
                setIsSubmittingEdit(false); // Reset loading state
                return;
            }

            const tableId = Number(editReservationForm.table_id);
            const reservationId = editReservationForm.reservation_id;

            // Find the original reservation to check if table has changed
            const allReservations = [...todayReservations];
            Object.values(upcomingGroupedByDate).forEach(dateReservations => {
                allReservations.push(...dateReservations);
            });

            const originalReservation = allReservations.find(r => r.reservation_id === reservationId);
            const originalTableId = originalReservation?.table_id;
            const tableChanged = originalTableId && (originalTableId !== tableId);

            // Calculate end time for consistency
            const endTime = editReservationForm.end_time ||
                new Date(new Date(editReservationForm.reservation_time).getTime() + 2 * 60 * 60 * 1000).toISOString();

            // Check availability using local method, excluding current reservation
            const availability = useReservationStore.getState().checkTableAvailabilityLocal(
                tableId,
                editReservationForm.reservation_time,
                endTime,
                reservationId,
                30 // 30 minute buffer
            );

            if (!availability.available) {
                // Show conflict details
                const conflicts = availability.conflictingReservations;
                const conflictTimes = conflicts.map(res => {
                    const startTime = new Date(res.reservation_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    const endTime = res.end_time ?
                        new Date(res.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                        "unspecified end time";

                    return `${startTime} - ${endTime} (${res.customer_name})`;
                }).join("\n");

                Alert.alert(
                    "Table Not Available",
                    `This table has conflicting reservations:\n\n${conflictTimes}\n\nPlease select another table or time.`,
                    [{ text: "OK" }]
                );

                setIsSubmittingEdit(false); // Reset loading state
                return;
            }

            // If the table has changed, check if the original table needs to be reset
            if (tableChanged) {
                console.log(`Table changed from ${originalTableId} to ${tableId} - checking if original table needs reset`);
                const originalTableNum = tables.find(t => t.table_id === originalTableId)?.table_num;

                if (originalTableNum) {
                    // Check if there are other active reservations for the original table
                    const otherReservationsForOriginalTable = allReservations.filter(r =>
                        r.reservation_id !== reservationId &&
                        r.table_id === originalTableId &&
                        !['completed', 'canceled'].includes(r.status)
                    );

                    if (otherReservationsForOriginalTable.length === 0) {
                        // No other active reservations, safe to mark as Available
                        console.log(`No other active reservations for table ${originalTableNum}, marking as Available`);
                        try {
                            await tableStore.getState().updateTableStatus(originalTableNum, 'Available');
                            console.log(`✅ Original table ${originalTableNum} marked as Available after reservation moved`);
                        } catch (error) {
                            console.error(`❌ Failed to mark original table ${originalTableNum} as Available:`, error);
                            // Continue execution, don't block the update
                        }
                    } else {
                        console.log(`Table ${originalTableNum} still has ${otherReservationsForOriginalTable.length} active reservations - keeping status`);
                    }
                }
            }

            // Prepare the reservation data
            const reservationData = {
                ...editReservationForm,
                party_size: Number(editReservationForm.party_size),
                table_id: tableId,
                end_time: endTime
            };

            // Update the reservation using the store's updateReservation function
            const updatedReservation = await updateReservation(reservationId, reservationData);
            console.log("✅ Reservation updated successfully:", updatedReservation);

            // Only update table status to Reserved if:
            // 1. The reservation time is within 2 hours AND
            // 2. The reservation is not in 'seated' status AND
            // 3. The table is not already marked as 'Unavailable'
            const reservationTime = new Date(editReservationForm.reservation_time);
            const currentTime = new Date();
            const twoHoursFromNow = new Date(currentTime.getTime() + (2 * 60 * 60 * 1000));
            const tableNum = tables.find(t => t.table_id === tableId)?.table_num || tableId;
            const table = tables.find(t => String(t.table_num) === String(tableNum));

            if (reservationTime <= twoHoursFromNow && 
                editReservationForm.status !== 'seated' && 
                table?.status !== 'Unavailable') {
                
                console.log(`Updated reservation at ${reservationTime.toLocaleTimeString()} is within 2 hours - marking table ${tableId} as Reserved`);

                // Create reservation details for the table
                const reservationDetails = {
                    customerName: editReservationForm.customer_name,
                    arrivalTime: new Date(editReservationForm.reservation_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    specialRequests: editReservationForm.notes || '',
                    reservedAt: new Date().toISOString(),
                    partySize: Number(editReservationForm.party_size)
                };

                // Immediately mark the table as Reserved
                try {
                    await tableStore.getState().updateTableStatus(
                        tableNum,
                        'Reserved',
                        reservationDetails
                    );
                    console.log(`✅ Table ${tableNum} marked as Reserved immediately for upcoming updated reservation`);
                } catch (error) {
                    console.error(`❌ Failed to mark table ${tableNum} as Reserved:`, error);
                    // Note: We don't want to block the reservation update if this fails
                    // The background process will retry later
                }
            }

            // Close the edit modal
            setShowEditReservationModal(false);

            // Refresh the UI with the latest data from the server
            await fetchAllReservationData(true);

        } catch (error) {
            console.error("Error updating reservation:", error);
            Alert.alert("Error", "Failed to update reservation");
        } finally {
            // Always reset loading state
            setIsSubmittingEdit(false);
        }
    };

    const handleSubmitNewReservation = async () => {
        const errors = validateForm();
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) return;

        // Set loading state to true
        setIsSubmittingNew(true);

        try {
            // First, ensure a table is selected
            if (!reservationForm.table_id) {
                setFormErrors(prev => ({ ...prev, table_id: "Please select a table" }));
                setIsSubmittingNew(false); // Reset loading state
                return;
            }

            // Convert table_id to number if it's a string
            const tableId = Number(reservationForm.table_id);

            // Calculate end time for consistency
            const endTime = reservationForm.end_time ||
                new Date(new Date(reservationForm.reservation_time).getTime() + 2 * 60 * 60 * 1000).toISOString();

            // Check availability using local method
            const availability = useReservationStore.getState().checkTableAvailabilityLocal(
                tableId,
                reservationForm.reservation_time,
                endTime
            );

            if (!availability.available) {
                // Show conflict details in the alert
                const conflicts = availability.conflictingReservations;
                const conflictTimes = conflicts.map(res => {
                    const startTime = new Date(res.reservation_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    const endTime = res.end_time ?
                        new Date(res.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                        "unspecified end time";

                    return `${startTime} - ${endTime} (${res.customer_name})`;
                }).join("\n");

                Alert.alert(
                    "Table Not Available",
                    `This table has conflicting reservations:\n\n${conflictTimes}\n\nPlease select another table or time.`,
                    [{ text: "OK" }]
                );

                // Refresh table availability to update UI
                checkAllTablesAvailability();
                setIsSubmittingNew(false); // Reset loading state
                return;
            }

            // Prepare the reservation data
            const reservationData = {
                ...reservationForm,
                party_size: Number(reservationForm.party_size),
                table_id: tableId,
                end_time: endTime
            };

            // Create the reservation using the store's createReservation function
            // This will update both the API and the local store state
            const newReservation = await createReservation(reservationData);
            console.log("✅ Reservation created successfully:", newReservation);

            // If available, proceed with marking the table as reserved if needed

            // Check if the reservation is within 2 hours from now
            // If so, immediately mark the table as Reserved
            const reservationTime = new Date(reservationForm.reservation_time);
            const currentTime = new Date();
            const twoHoursFromNow = new Date(currentTime.getTime() + 2 * 60 * 60 * 1000);

            if (reservationTime <= twoHoursFromNow) {
                console.log(`Reservation at ${reservationTime.toLocaleTimeString()} is within 2 hours - marking table ${tableId} as Reserved immediately`);

                // Get the table number
                const tableNum = tables.find(t => t.table_id === tableId)?.table_num || tableId;

                // Create reservation details for the table
                const reservationDetails = {
                    customerName: reservationForm.customer_name,
                    arrivalTime: new Date(reservationForm.reservation_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    specialRequests: reservationForm.notes || '',
                    reservedAt: new Date().toISOString(),
                    partySize: Number(reservationForm.party_size)
                };

                // Immediately mark the table as Reserved
                try {
                    await tableStore.getState().updateTableStatus(
                        tableNum,
                        'Reserved',
                        reservationDetails
                    );
                    console.log(`✅ Table ${tableNum} marked as Reserved immediately for upcoming reservation`);
                } catch (error) {
                    console.error(`❌ Failed to mark table ${tableNum} as Reserved:`, error);
                    // Note: We don't want to block the reservation creation if this fails
                    // The background process will retry later
                }
            }

            // Close the new reservation modal
            setShowNewReservationModal(false);

            // Clear params processed flags to prevent edit modal from showing
            paramsProcessedRef.current.createNew = false;
            paramsProcessedRef.current.viewReservation = false;

            // Reset URL params to prevent unwanted modal openings
            router.replace('/reservation');

            // Refresh the UI with the latest data from the server
            await fetchAllReservationData(true);

        } catch (error) {
            console.error("Error creating reservation:", error);
            Alert.alert("Error", "Failed to create reservation");
        } finally {
            // Always reset loading state
            setIsSubmittingNew(false);
        }
    };



    // Function to calculate end time if not provided
    const getEndTime = () => {
        if (reservationForm.end_time) return reservationForm.end_time;

        // Default to 2 hours after start time
        return new Date(
            new Date(reservationForm.reservation_time).getTime() + 2 * 60 * 60 * 1000
        ).toISOString();
    };

    // Function to check availability for all tables
    const checkAllTablesAvailability = () => {
        if (!reservationForm.reservation_time) return;

        console.log("🔍 Checking table availability locally...");
        setCheckingAvailability(true);

        try {
            const endTime = getEndTime();

            // Use local method with buffer instead of API calls
            const tablesWithAvailability = tables.map(table => {
                const result = useReservationStore.getState().checkTableAvailabilityLocal(
                    table.table_id,
                    reservationForm.reservation_time,
                    endTime,
                    null, // No exclusion for new reservations
                    30    // 30 minute buffer between reservations
                );

                return {
                    ...table,
                    available: result.available,
                    conflicts: result.conflictingReservations
                };
            });

            setAvailableTables(tablesWithAvailability);
        } catch (error) {
            Alert.alert("Error", "Failed to check table availability");
        } finally {
            setCheckingAvailability(false);
        }
    };

    // Add at the top of your component
    const initialCheckDoneRef = useRef(false);

    // Then modify your effect:
    useEffect(() => {
        if (showNewReservationModal && reservationForm.reservation_time) {
            if (!showNewReservationModal) {
                // Reset flag when modal closes
                initialCheckDoneRef.current = false;
                return;
            }

            // Only do ONE check when the modal first opens
            if (!initialCheckDoneRef.current) {
                console.log("Initial availability check");
                initialCheckDoneRef.current = true;
                checkAllTablesAvailability();
            } else if (initialCheckDoneRef.current) {
                // For subsequent dependency changes (like time changes),
                // only check if the user has actually changed the time
                console.log("Time-based availability check");
                checkAllTablesAvailability();
            }
        }
    }, [showNewReservationModal, reservationForm.reservation_time, reservationForm.end_time]);

    useEffect(() => {
        if (showEditReservationModal && editReservationForm.reservation_time && editReservationForm.reservation_id) {
            checkAllTablesAvailabilityForEdit(editReservationForm.reservation_id);
        }
    }, [showEditReservationModal, editReservationForm.reservation_time, editReservationForm.end_time]);

    // Handle URL parameters when the component mounts or on navigation
    useEffect(() => {
        // If we have data and there are URL parameters
        if (!loading && params) {
            // Only process if neither flag is set
            if (!paramsProcessedRef.current.createNew && !paramsProcessedRef.current.viewReservation) {
                // Case 1: Creating a new reservation with pre-selected table (handle this first)
                if (params.createNew === 'true' && params.selectedTableId) {
                    paramsProcessedRef.current.createNew = true;
                    console.log(`Creating new reservation for table ID: ${params.selectedTableId}`);

                    // Set the form with the selected table and open modal
                    setReservationForm(prev => ({
                        ...prev,
                        table_id: params.selectedTableId
                    }));

                    // Open the modal after a short delay to ensure the form is updated
                    setTimeout(() => {
                        setShowNewReservationModal(true);
                    }, 100);
                }
                // Case 2: Viewing a specific reservation (only if not creating new)
                else if (params.viewReservation === 'true' && params.reservationId) {
                    paramsProcessedRef.current.viewReservation = true;
                    console.log(`Looking for reservation ID: ${params.reservationId}`);

                    // Find all reservations (combine today and all upcoming)
                    const allReservations = [
                        ...todayReservations,
                        ...Object.values(upcomingGroupedByDate).flat()
                    ];

                    // Find the target reservation
                    const targetReservation = allReservations.find(res =>
                        String(res.reservation_id) === String(params.reservationId)
                    );

                    if (targetReservation) {
                        console.log('Found reservation, opening edit modal');
                        handleEditReservation(targetReservation);
                    }
                }
            }
        }
    // Important: We only want this to run on initial load and when data changes,
    // NOT when URL params change (like during status updates)
    }, [loading, todayReservations, upcomingGroupedByDate]);
    // ^ Removed 'params' from dependency array to prevent re-triggering on URL changes

    // Clear the URL parameters after status change to prevent edit modal from showing unexpectedly
    useEffect(() => {
        // If we're not in the process of viewing or creating a reservation,
        // and there are URL parameters, clear them
        if (!showNewReservationModal && 
            !showEditReservationModal && 
            !paramsProcessedRef.current.createNew && 
            !paramsProcessedRef.current.viewReservation &&
            (params.viewReservation === 'true' || params.createNew === 'true')) {
            // Replace URL without the query parameters
            router.replace('/reservation');
        }
    }, [showNewReservationModal, showEditReservationModal, params]);

    // Reset the params processed flag when the modals are closed
    useEffect(() => {
        if (!showNewReservationModal) {
            paramsProcessedRef.current.createNew = false;
        }
    }, [showNewReservationModal]);

    useEffect(() => {
        if (!showEditReservationModal) {
            paramsProcessedRef.current.viewReservation = false;
            // Clear viewReservation parameter when edit modal is closed
            if (params.viewReservation === 'true') {
                router.replace('/reservation');
            }
        }
    }, [showEditReservationModal]);

    // Modal opening handler
    const openNewReservationModal = () => {
        // Set form values and reset errors
        setReservationForm({
            customer_name: '',
            customer_phone: '',
            customer_email: '',
            party_size: 2,
            table_id: params?.selectedTableId || '', // Use selected table from params if available
            reservation_time: new Date().toISOString(),
            end_time: '',
            status: 'pending',
            notes: ''
        });
        setFormErrors({});

        // Show modal first for better UX
        setShowNewReservationModal(true);

        // Check availability immediately - it's fast now since it's local
        checkAllTablesAvailability();
    };

    useEffect(() => {
        if (showNewReservationModal && reservationForm.reservation_time) {
            // Local check is fast and doesn't need throttling
            checkAllTablesAvailability();
        }
    }, [showNewReservationModal, reservationForm.reservation_time, reservationForm.end_time]);

    useEffect(() => {
        if (showEditReservationModal && editReservationForm.reservation_time && editReservationForm.reservation_id) {
            checkAllTablesAvailabilityForEdit(editReservationForm.reservation_id);
        }
    }, [showEditReservationModal, editReservationForm.reservation_time, editReservationForm.end_time]);

    // Function to check if a reservation should be auto-completed
    const checkAndAutoUpdatePastReservations = useCallback(() => {
        if (!todayReservations || !upcomingGroupedByDate) return;

        const now = new Date();
        const pastReservations = [];

        // Check today's reservations
        todayReservations.forEach(reservation => {
            if (['pending', 'confirmed', 'seated'].includes(reservation.status)) {
                const reservationTime = new Date(reservation.reservation_time);
                const endTime = reservation.end_time ? new Date(reservation.end_time) :
                    new Date(reservationTime.getTime() + (2 * 60 * 60 * 1000)); // Default 2 hours

                if (now > endTime) {
                    pastReservations.push({
                        id: reservation.reservation_id,
                        status: reservation.status
                    });
                }
            }
        });

        // Check upcoming reservations
        Object.values(upcomingGroupedByDate).forEach(reservationsForDate => {
            reservationsForDate.forEach(reservation => {
                if (['pending', 'confirmed', 'seated'].includes(reservation.status)) {
                    const reservationTime = new Date(reservation.reservation_time);
                    const endTime = reservation.end_time ? new Date(reservation.end_time) :
                        new Date(reservationTime.getTime() + (2 * 60 * 60 * 1000)); // Default 2 hours

                    if (now > endTime) {
                        pastReservations.push({
                            id: reservation.reservation_id,
                            status: reservation.status
                        });
                    }
                }
            });
        });

        // Update status for past reservations
        if (pastReservations.length > 0) {
            console.log(`Found ${pastReservations.length} past reservations to update`);
            pastReservations.forEach(async (item) => {
                // Mark seated as completed, mark pending/confirmed as canceled
                const newStatus = item.status === 'seated' ? 'completed' : 'completed';
                await updateReservationStatus(item.id, newStatus);
            });
        }
    }, [todayReservations, upcomingGroupedByDate, updateReservationStatus]);

    // Call auto-update function when data changes
    useEffect(() => {
        checkAndAutoUpdatePastReservations();
    }, [checkAndAutoUpdatePastReservations]);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
            <View className="flex-1 ml-[115px]">
                <ReservationHeader
                    onNewReservation={openNewReservationModal}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onClearSearch={() => setSearchQuery('')}
                />

                {/* Add filter for past reservations */}
                <View className="px-6 pt-2 flex-row items-center justify-end">
                    <Text className="text-gray-600 mr-2">Show completed/canceled</Text>
                    <Switch
                        value={showPastReservations}
                        onValueChange={setShowPastReservations}
                        trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
                        thumbColor={showPastReservations ? "#3b82f6" : "#f3f4f6"}
                    />
                </View>

                <ScrollView
                    className="flex-1 px-6 pt-2"
                    ref={scrollViewRef}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="always">

                    <DateNavigation
                        dateOptions={dateOptions}
                        selectedDateTab={selectedDateTab}
                        onDateSelect={setSelectedDateTab}
                        upcomingGroupedByDate={upcomingGroupedByDate}
                    />

                    {/* Status helper text */}
                    <View className="bg-white p-4 rounded-lg mb-4 border border-gray-100 shadow-sm">
                        <Text className="text-gray-800 font-medium mb-2">Reservation Status Guide:</Text>
                        <View className="flex-row flex-wrap">
                            <View className="flex-row items-center mr-4 mb-2">
                                <View className="w-3 h-3 rounded-full bg-amber-100 mr-1" />
                                <Text className="text-xs text-gray-600">Pending: Not yet confirmed</Text>
                            </View>
                            <View className="flex-row items-center mr-4 mb-2">
                                <View className="w-3 h-3 rounded-full bg-green-100 mr-1" />
                                <Text className="text-xs text-gray-600">Confirmed: Verified but not seated</Text>
                            </View>
                            <View className="flex-row items-center mr-4 mb-2">
                                <View className="w-3 h-3 rounded-full bg-blue-100 mr-1" />
                                <Text className="text-xs text-gray-600">Seated: Customers are at table</Text>
                            </View>
                            <View className="flex-row items-center mr-4 mb-2">
                                <View className="w-3 h-3 rounded-full bg-purple-100 mr-1" />
                                <Text className="text-xs text-gray-600">Completed: Reservation finished</Text>
                            </View>
                            <View className="flex-row items-center mb-2">
                                <View className="w-3 h-3 rounded-full bg-red-100 mr-1" />
                                <Text className="text-xs text-gray-600">Canceled: Reservation canceled</Text>
                            </View>
                        </View>
                    </View>

                    {/* Rest of the render logic */}
                    {loading ? (
                        <LoadingState />
                    ) : error ? (
                        <ErrorState error={error} onRetry={fetchTodayReservations} />
                    ) : filteredReservations.length === 0 ? (
                        <EmptyState
                            dateLabel={dateOptions.find(opt => opt.value === selectedDateTab)?.label || 'this day'}
                            searchQuery={searchQuery}
                            onCreateNew={() => setShowNewReservationModal(true)}
                        />
                    ) : (
                        <ReservationList
                            selectedDateTab={selectedDateTab}
                            filteredReservations={filteredReservations}
                            groupedReservations={groupedReservations}
                            statusOrder={statusOrder}
                            onEdit={handleEditReservation}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDeleteReservation}
                            formatDate={formatDate}
                        />
                    )}
                </ScrollView>

                <NewReservationModal
                    visible={showNewReservationModal}
                    onClose={() => setShowNewReservationModal(false)}
                    modalAnimation={modalAnimation}
                    form={reservationForm}
                    onUpdateForm={setReservationForm}
                    formErrors={formErrors}
                    tables={tables}
                    checkingAvailability={checkingAvailability}
                    availableTables={availableTables}
                    onSubmit={handleSubmitNewReservation}
                    isSubmitting={isSubmittingNew} // Pass isSubmitting state
                    datePickers={{
                        isDatePickerVisible,
                        isEndDatePickerVisible,
                        showDatePicker,
                        hideDatePicker,
                        showEndDatePicker,
                        hideEndDatePicker,
                        handleDateConfirm,
                        handleEndDateConfirm,
                        clearEndTime,
                    }}
                />

                <EditReservationModal
                    visible={showEditReservationModal}
                    onClose={() => setShowEditReservationModal(false)}
                    modalAnimation={editModalAnimation}
                    form={editReservationForm}
                    onUpdateForm={setEditReservationForm}
                    formErrors={editFormErrors}
                    tables={tables}
                    checkingAvailability={checkingAvailability}
                    availableTables={availableTables}
                    onSubmit={handleUpdateReservation}
                    isSubmitting={isSubmittingEdit} // Pass isSubmitting state
                    datePickers={{
                        isDatePickerVisible: isEditDatePickerVisible,
                        isEndDatePickerVisible: isEditEndDatePickerVisible,
                        showDatePicker: showEditDatePicker,
                        hideDatePicker: hideEditDatePicker,
                        showEndDatePicker: showEditEndDatePicker,
                        hideEndDatePicker: hideEditEndDatePicker,
                        handleDateConfirm: handleEditDateConfirm,
                        handleEndDateConfirm: handleEditEndDateConfirm,
                        clearEndTime: clearEditEndTime,
                    }}
                />

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
            </View>
        </SafeAreaView>
    );
};

// Add loading and error states as internal components
const LoadingState = () => (
    <View className="py-20 items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading reservations...</Text>
    </View>
);

const ErrorState = ({ error, onRetry }) => (
    <View className="py-20 items-center">
        <View className="bg-red-50 rounded-full p-6 mb-2">
            <Feather name="alert-circle" size={50} color="#ef4444" />
        </View>
        <Text className="mt-4 text-red-500 font-semibold text-lg">Unable to load reservations</Text>
        <Text className="mt-2 text-gray-500 text-center px-10">{error}</Text>
        <TouchableOpacity
            onPress={onRetry}
            className="mt-6 bg-blue-600 px-6 py-3 rounded-xl">
            <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
    </View>
);

export default Reservation;