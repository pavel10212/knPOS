import { Image, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'

const MenuItem = ({
    title,
    price,
    image,
    description,
    onChangeQuantity,
    currentQuantity = 0
}) => {
    const handlePress = (action) => {
        if (!onChangeQuantity) return;
        if (action === 'remove' && currentQuantity === 0) return;
        onChangeQuantity(action);
    };

    return (
        <View style={{
            width: '30%',
            backgroundColor: 'white',
            borderRadius: 16,
            margin: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            overflow: 'hidden',
        }}>
            {/* Image container with custom overlay */}
            <View style={{ position: 'relative', height: 180 }}>
                <Image
                    source={{ uri: image }}
                    resizeMode='cover'
                    style={{ width: '100%', height: '100%' }}
                />
                {/* Gradient effect using View overlay */}
                <View style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 60,
                    backgroundColor: 'transparent',
                    backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.3))',
                }}>
                </View>
            </View>

            {/* Content container */}
            <View style={{ padding: 16, gap: 8 }}>
                <Text
                    numberOfLines={1}
                    style={{
                        fontWeight: 'bold',
                        fontSize: 18,
                        color: '#1F2937'
                    }}
                >
                    {title}
                </Text>

                {description && (
                    <Text
                        numberOfLines={2}
                        style={{
                            fontSize: 12,
                            color: '#6B7280',
                            lineHeight: 16
                        }}
                    >
                        {description}
                    </Text>
                )}

                {/* Price and quantity controls */}
                <View style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#F3F4F6',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Text style={{
                        fontSize: 20,
                        fontWeight: '600',
                        color: '#059669'
                    }}>
                        ฿{parseFloat(price).toFixed(2)}
                    </Text>

                    {onChangeQuantity && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => handlePress('remove')}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: currentQuantity === 0 ? '#F3F4F6' : '#E5E7EB',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                disabled={currentQuantity === 0}
                            >
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                    color: currentQuantity === 0 ? '#9CA3AF' : '#4B5563'
                                }}>
                                    -
                                </Text>
                            </TouchableOpacity>

                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                minWidth: 24,
                                textAlign: 'center'
                            }}>
                                {currentQuantity}
                            </Text>

                            <TouchableOpacity
                                onPress={() => handlePress('add')}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: '#8390DA', // Primary color
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.2,
                                    shadowRadius: 1,
                                    elevation: 2,
                                }}
                            >
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: 'bold',
                                    color: 'white'
                                }}>
                                    +
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </View>
    )
}

export default MenuItem
