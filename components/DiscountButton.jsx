import { Text, TouchableOpacity } from 'react-native';

const DiscountButton = ({ percentage, selected, onSelect, text }) => {
    return (
        <TouchableOpacity
            onPress={() => onSelect(percentage)}
            className={`px-3 py-2 rounded-lg ${selected ? 'bg-primary' : 'bg-[#EAF0F0]'}`}
        >
            <Text className={`${selected ? 'text-white' : 'text-black'}`}>
                {text || `${percentage}%`}
            </Text>
        </TouchableOpacity>
    );
};

export default DiscountButton;
