import { format, isToday, isYesterday, isTomorrow, addDays } from 'date-fns';

export const formatDate = (dateString) => {
    const date = new Date(dateString);

    if (isToday(date)) {
        return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
        return `Yesterday at ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
        return `Tomorrow at ${format(date, 'h:mm a')}`;
    } else if (date > new Date() && date < addDays(new Date(), 7)) {
        return format(date, 'EEEE') + ` at ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM dd, yyyy • h:mm a');
};

export const groupReservationsByTimeBlocks = (reservations) => {
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
