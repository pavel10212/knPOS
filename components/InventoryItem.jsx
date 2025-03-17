import { Text, View, TouchableOpacity } from "react-native";
import React from "react";

const InventoryItem = ({
    title,
    quantity,
    unit,
    currentQuantity,
    onChangeQuantity,
    isEditMode,
    disabled
}) => {
    const handlePress = (action) => {
        if (!onChangeQuantity || disabled) return;
        if (action === 'remove' && currentQuantity === 0) return;
        onChangeQuantity(action);
    };

    return (
        <View style={{
            width: '100%',
            backgroundColor: 'white',
            borderRadius: 12,
            marginBottom: 8,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 2,
            elevation: 2,
            opacity: disabled ? 0.6 : 1
        }}>
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <View style={{ flex: 1 }}>
                    <Text
                        style={{
                            fontWeight: 'bold',
                            fontSize: 18,
                            color: '#1F2937',
                            marginBottom: 4
                        }}
                        numberOfLines={1}
                    >
                        {title}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>
                            Cost per unit:
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '500',
                            color: '#059669',
                            marginLeft: 4
                        }}>
                            ฿{parseFloat(unit).toFixed(2)}
                        </Text>
                    </View>

                    {disabled && (
                        <View style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            borderRadius: 4,
                            alignSelf: 'flex-start',
                            marginTop: 8
                        }}>
                            <Text style={{
                                fontSize: 12,
                                color: '#EF4444',
                                fontWeight: '600'
                            }}>
                                Out of stock
                            </Text>
                        </View>
                    )}

                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 8
                    }}>
                        <Text style={{ fontSize: 14, color: '#6B7280' }}>
                            Available:
                        </Text>
                        <View style={{
                            backgroundColor: '#F3F4F6',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 4,
                            marginLeft: 4
                        }}>
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: '#4B5563'
                            }}>
                                {quantity}
                            </Text>
                        </View>
                    </View>
                </View>

                {isEditMode && (
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <TouchableOpacity
                            onPress={() => handlePress('remove')}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: currentQuantity === 0 ? '#F3F4F6' : '#E5E7EB',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12
                            }}
                            disabled={disabled || currentQuantity === 0}
                        >
                            <Text style={{
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: currentQuantity === 0 || disabled ? '#9CA3AF' : '#4B5563'
                            }}>
                                -
                            </Text>
                        </TouchableOpacity>

                        <View style={{
                            backgroundColor: '#F9FAFB',
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            minWidth: 50,
                            alignItems: 'center'
                        }}>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: '#1F2937'
                            }}>
                                {isEditMode ? currentQuantity : quantity}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => handlePress('add')}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                backgroundColor: disabled ? '#9CA3AF' : '#8390DA',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: 12,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.2,
                                shadowRadius: 1,
                                elevation: 2,
                            }}
                            disabled={disabled || (quantity <= currentQuantity)}
                        >
                            <Text style={{
                                fontSize: 16,
                                fontWeight: 'bold',
                                color: 'white'
                            }}>
                                +
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {!isEditMode && (
                    <View style={{
                        backgroundColor: '#F3F4F6',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8
                    }}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#4B5563'
                        }}>
                            {quantity}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export default InventoryItem;
