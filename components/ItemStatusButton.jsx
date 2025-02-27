import { TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const ItemStatusButton = ({ status, itemType, onPress }) => {
    const isCompleted = status === 'Completed';

    const getStatusConfig = () => {
        switch (status) {
            case 'Completed':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-700',
                    icon: 'check-circle',
                    label: 'Completed'
                };
            case 'Ready':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-700',
                    icon: 'done',
                    label: 'Ready'
                };
            case 'In Progress':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-700',
                    icon: 'hourglass-top',
                    label: 'In Progress'
                };
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    icon: 'pending',
                    label: 'Pending'
                };
        }
    };

    const config = getStatusConfig();
    // Always set next action to "Mark as Completed"
    const nextAction = 'Mark as Completed';

    return (
        <TouchableOpacity
            onPress={isCompleted ? null : onPress}
            disabled={isCompleted}
            className={`flex-row items-center px-3 py-2 rounded-lg ${config.bg} ${isCompleted ? 'opacity-60' : ''
                }`}
            activeOpacity={isCompleted ? 1 : 0.7}
        >
            <MaterialIcons
                name={config.icon}
                size={16}
                color={isCompleted ? '#059669' : '#6B7280'}
            />
            <Text className={`${config.text} font-medium text-sm ml-1`}>
                {isCompleted ? 'Completed' : nextAction}
            </Text>
        </TouchableOpacity>
    );
};

export default ItemStatusButton;
