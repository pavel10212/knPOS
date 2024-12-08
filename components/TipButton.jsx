import { TouchableOpacity, Text } from "react-native";

const TipButton = ({ percentage, selected, onSelect, text }) => (
    <TouchableOpacity
        onPress={() => onSelect(percentage)}
        className={`py-2 px-4 rounded-lg ${selected ? 'bg-primary' : 'bg-[#EAF0F0]'}`}
    >
        <Text className={`${selected ? 'text-white' : 'text-gray-600'}`}>
            {text || `${percentage}%`}
        </Text>
    </TouchableOpacity>
);

export default TipButton;