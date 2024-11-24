import { TouchableOpacity, Text } from "react-native";

const TipButton = ({ percentage, selected, onSelect }) => (
    <TouchableOpacity 
        onPress={() => onSelect(percentage)}
        className={`bg-[#EAF0F0] p-2 rounded-lg ${selected ? 'bg-[#D1D7D7]' : ''}`}
    >
        <Text className='text-black font-semibold'>{percentage}%</Text>
    </TouchableOpacity>
);

export default TipButton;