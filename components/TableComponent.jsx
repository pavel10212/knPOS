import { Text, PanResponder, Animated, TouchableOpacity } from 'react-native'
import React, { useRef, useState } from 'react'

const TableComponent = ({ 
    number, 
    persons, 
    status, 
    isEditing, 
    position: savedPosition, 
    onPositionChange,
    onTableSelect 
}) => {
    const position = useRef(new Animated.ValueXY(savedPosition || { x: 0, y: 0 })).current;
    const [dragging, setDragging] = useState(false)



    const ifClicked = () => {
        if (!isEditing && onTableSelect) {
            onTableSelect();
        }
    }

    const getBackgroundColor = () => {
        switch (status) {
            case 'unavailable': return 'bg-red-700'
            case 'available': return 'bg-green-600'
            case 'reserved': return 'bg-yellow-500'
            default: return 'bg-gray-500'
        }
    }
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                position.setOffset({
                    x: position.x._value,
                    y: position.y._value
                });
                position.setValue({ x: 0, y: 0 });
                setDragging(true);
            },
            onPanResponderMove: Animated.event(
                [
                    null,
                    {
                        dx: position.x,
                        dy: position.y
                    },
                ],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                position.flattenOffset();
                setDragging(false);
                onPositionChange(number, {
                    x: position.x._value,
                    y: position.y._value
                });
            }
        })
    ).current;

    const shape = persons === 2 ? 'rounded-full' : 'rounded-lg'



    if (isEditing) {
        return (
            <Animated.View
                {...panResponder.panHandlers}
                style={{
                    transform: position.getTranslateTransform()
                }}
                className={`${getBackgroundColor()} p-4 ${shape} w-32 h-32 justify-center items-center`}
            >
                <Text className="text-white font-bold text-lg">Table {number}</Text>
                <Text className="text-white text-sm">{persons} Persons</Text>
            </Animated.View>
        )
    }

    return (
        <TouchableOpacity
            onPress={ifClicked}
            className={`${getBackgroundColor()} p-4 ${shape} w-32 h-32 justify-center items-center`}
        >
            <Text className="text-white font-bold text-lg">Table {number}</Text>
            <Text className="text-white text-sm">{persons} Persons</Text>
        </TouchableOpacity>
    )
}

export default TableComponent