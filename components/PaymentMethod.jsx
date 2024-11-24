import { TouchableOpacity, Image, Text } from "react-native";


const PaymentMethod = ({ method, icon, selected, onSelect }) => (
    <TouchableOpacity
        onPress={() => onSelect(method)}
        className={`p-2 rounded-lg w-[70px] h-[60px] flex items-center justify-center ${selected ? 'bg-[#D1D7D7]' : 'bg-[#EAF0F0]'
            }`}
    >
        <Image
            source={icon}
            className='w-8 h-8'
            resizeMode='contain'
        />
        <Text className='text-black font-semibold'>{method}</Text>
    </TouchableOpacity>
);

export default PaymentMethod;