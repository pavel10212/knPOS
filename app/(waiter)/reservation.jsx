import { useState, useCallback, useRef, useEffect } from "react";
import { useSharedStore } from "../../hooks/useSharedStore";
import {
    View, Text, ScrollView, ActivityIndicator, Alert, Switch,
    Animated, StatusBar, Dimensions, TouchableOpacity
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
import { useLocalSearchParams } from 'expo-router';

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
        updateReservationStatus,
        deleteReservation,
        checkTableAvailability
    } = useReservationStore();

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
            status: reservationData.status || 'pending',
            notes: reservationData.notes || ''
        });

        // Reset form errors
        setEditFormErrors({});

        // Show the modal
        setShowEditReservationModal(true);

        // Check table availability for this reservation 
        // (passing the reservation_id ensures this reservation is excluded from conflict check)
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

    const handleUpdateReservation = async () => {
        const errors = validateEditForm();
        setEditFormErrors(errors);

        if (Object.keys(errors).length > 0) return;

        try {
            // Ensure table is selected
            if (!editReservationForm.table_id) {
                setEditFormErrors(prev => ({ ...prev, table_id: "Please select a table" }));
                return;
            }

            const tableId = Number(editReservationForm.table_id);
            const reservationId = editReservationForm.reservation_id;

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

                return;
            }

            // If available, update the reservation
            const updatedReservation = await updateReservation(reservationId, {
                ...editReservationForm,
                party_size: Number(editReservationForm.party_size),
                table_id: tableId,
                end_time: endTime // Ensure end_time is always set
            });
            
            // Check if the reservation is within 2 hours from now
            // If so, immediately mark the table as Reserved
            const reservationTime = new Date(editReservationForm.reservation_time);
            const currentTime = new Date();
            const twoHoursFromNow = new Date(currentTime.getTime() + (2 * 60 * 60 * 1000));
            
            if (reservationTime <= twoHoursFromNow) {
                console.log(`Updated reservation at ${reservationTime.toLocaleTimeString()} is within 2 hours - marking table ${tableId} as Reserved immediately`);
                
                // Get the table number
                const tableNum = tables.find(t => t.table_id === tableId)?.table_num || tableId;
                
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

            setShowEditReservationModal(false);
            fetchTodayReservations();
        } catch (error) {
            Alert.alert("Error", "Failed to update reservation");
        }
    };

    const handleSubmitNewReservation = async () => {
        const errors = validateForm();
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) return;

        try {
            // First, ensure a table is selected
            if (!reservationForm.table_id) {
                setFormErrors(prev => ({ ...prev, table_id: "Please select a table" }));
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
                return;
            }

            // If available, proceed with creating the reservation
            const newReservation = await createReservation({
                ...reservationForm,
                party_size: Number(reservationForm.party_size),
                table_id: tableId,
                end_time: endTime // Ensure end_time is always set
            });

            // Check if the reservation is within 2 hours from now
            // If so, immediately mark the table as Reserved
            const reservationTime = new Date(reservationForm.reservation_time);
            const currentTime = new Date();
            const twoHoursFromNow = new Date(currentTime.getTime() + (2 * 60 * 60 * 1000));
            
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

            setShowNewReservationModal(false);
            fetchTodayReservations();
        } catch (error) {
            Alert.alert("Error", "Failed to create reservation");
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
            // Case 1: We're viewing a specific reservation
            if (params.viewReservation === 'true' && params.reservationId && 
                !paramsProcessedRef.current.viewReservation) {
                
                paramsProcessedRef.current.viewReservation = true;
                console.log(`Looking for reservation ID: ${params.reservationId}`);
                
                // Find all reservations (combine today and all upcoming)
                const allReservations = [];
                todayReservations.forEach(res => allReservations.push(res));
                
                // Add all reservations from upcomingGroupedByDate
                Object.values(upcomingGroupedByDate).forEach(reservationsForDate => {
                    reservationsForDate.forEach(res => allReservations.push(res));
                });
                
                // Find the target reservation
                const targetReservation = allReservations.find(res => 
                    String(res.reservation_id) === String(params.reservationId)
                );
                
                if (targetReservation) {
                    console.log('Found reservation, opening edit modal');
                    handleEditReservation(targetReservation);
                }
            }
            
            // Case 2: Creating a new reservation with pre-selected table
            else if (params.createNew === 'true' && params.selectedTableId && 
                     !paramsProcessedRef.current.createNew) {
                
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
        }
    }, [loading, params, todayReservations, upcomingGroupedByDate]);

    // Reset the params processed flag when the modals are closed
    useEffect(() => {
        if (!showNewReservationModal) {
            paramsProcessedRef.current.createNew = false;
        }
    }, [showNewReservationModal]);

    useEffect(() => {
        if (!showEditReservationModal) {
            paramsProcessedRef.current.viewReservation = false;
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
                    showsVerticalScrollIndicator={false}>

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