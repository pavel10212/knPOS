import { TouchableOpacity, Text, View } from 'react-native';

const getStatusStyle = (status) => {
  switch (status) {
    case 'Pending':
      return 'bg-gray-100 border-gray-300';
    case 'In Progress':
      return 'bg-yellow-100 border-yellow-300';
    case 'Ready':
      return 'bg-green-100 border-green-300';
    case 'Completed':
      return 'bg-blue-100 border-blue-300';
    default:
      return 'bg-gray-100 border-gray-300';
  }
};

const getNextStatus = (currentStatus, itemType) => {
  if (itemType === 'inventory') {
    return currentStatus === 'Pending' ? 'Completed' : null;
  }
  
  switch (currentStatus) {
    case 'Pending':
      return 'In Progress';
    case 'In Progress':
      return 'Ready';
    case 'Ready':
      return 'Completed';
    default:
      return null;
  }
};

const ItemStatusButton = ({ status, itemType, onPress }) => {
  const nextStatus = getNextStatus(status, itemType);
  
  return (
    <TouchableOpacity 
      onPress={nextStatus ? onPress : null}
      disabled={!nextStatus}
      className={`px-3 py-1.5 rounded-lg border ${getStatusStyle(status)} flex-row items-center`}
    >
      <Text className="text-sm font-medium text-gray-700">{status}</Text>
      {nextStatus && (
        <View className="ml-2 w-4 h-4 rounded-full bg-white border border-gray-300 items-center justify-center">
          <Text className="text-xs">→</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ItemStatusButton;
