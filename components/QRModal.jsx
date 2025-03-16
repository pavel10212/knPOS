import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from "react-native";
import QRCode from 'react-native-qrcode-svg';
import { tableStore } from "../hooks/useStore";
import { useSharedStore } from "../hooks/useSharedStore";
import { initializePrinter, printQRCode } from '../utils/printerUtil';
import { qrService } from '../services/qrService';

const QRModal = ({ visible, onClose, table_num }) => {
    const [qrValue, setQrValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const qrRef = useRef(null);
    const lastTableRef = useRef(null);
    const tables = useSharedStore((state) => state.tables);
    const updateTableStatus = tableStore((state) => state.updateTableStatus);

    console.log('QRmodal value:', qrValue);

    useEffect(() => {
        initializePrinter().catch(err => {
            console.error('Printer initialization failed:', err);
            setError('Failed to initialize printer');
        });
    }, []);

    // Get a clean base64 string from the QR code reference
    const getQRBase64 = () => {
        return new Promise((resolve, reject) => {
            if (!qrValue || !qrRef.current) {
                reject(new Error('QR code not generated yet'));
                return;
            }
            try {
                qrRef.current.toDataURL((dataURL) => {
                    if (!dataURL) {
                        reject(new Error('No data received from QR code'));
                        return;
                    }
                    const cleanBase64 = dataURL.substring(dataURL.indexOf(',') + 1).trim();
                    if (!cleanBase64) {
                        reject(new Error('Invalid QR code data'));
                        return;
                    }
                    resolve(cleanBase64);
                });
            } catch (err) {
                console.error('QR generation error:', err);
                reject(new Error('Failed to generate QR code image'));
            }
        });
    };

    const handlePrint = async () => {
        if (!qrValue) {
            setError('QR code not generated yet');
            return;
        }
        try {
            const base64Data = await getQRBase64();
            await printQRCode(base64Data, table_num);
        } catch (error) {
            console.error('Printing failed:', error);
            setError(`Failed to print: ${error.message}`);
        }
    };

    // Reset state when modal is closed
    useEffect(() => {
        if (!visible) {
            setQrValue('');
            setError(null);
        }
    }, [visible]);

    // Generate QR code when modal is visible and table_num is available
    useEffect(() => {
        if (!visible || !table_num || !tables) return;

        // Check if this is a different table than before
        const isDifferentTable = lastTableRef.current !== table_num;
        lastTableRef.current = table_num;

        // Only generate if we don't have a QR value yet or it's a different table
        if (qrValue === '' || isDifferentTable) {
            const generateQRAndUpdateTable = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const table = tables.find(t => String(t.table_num) === String(table_num));
                    if (!table) {
                        throw new Error('Table not found');
                    }

                    const { url } = await qrService.generateToken(table_num);
                    if (!url) throw new Error('Invalid QR code data');
                    setQrValue(url);

                    // Only update status if not already unavailable
                    if (table.table_status !== "Unavailable") {
                        await updateTableStatus(table_num, "Unavailable");
                    }
                } catch (error) {
                    console.error('Operation failed:', error);
                    setError('Failed to generate QR code. Please try again.');
                } finally {
                    setIsLoading(false);
                }
            };
            generateQRAndUpdateTable();
        }
    }, [visible, table_num, tables, qrValue]);

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, marginBottom: 16 }}>Scan this QR code for table {table_num}</Text>
                    <View style={{ padding: 10, backgroundColor: 'white', borderRadius: 8 }}>
                        {isLoading ? (
                            <ActivityIndicator size="large" color="#0000ff" />
                        ) : error ? (
                            <Text style={{ color: 'red' }}>{error}</Text>
                        ) : (
                            <QRCode
                                value={qrValue || 'Error'}
                                size={200}
                                getRef={(c) => { qrRef.current = c; }}
                                ecl="M"
                                quietZone={10}
                            />
                        )}
                    </View>
                    <View style={{ flexDirection: 'row', marginTop: 16 }}>
                        <TouchableOpacity style={{ backgroundColor: 'blue', padding: 10, borderRadius: 8, marginRight: 10 }} onPress={handlePrint}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Print</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: 'green', padding: 10, borderRadius: 8 }} onPress={onClose}>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default QRModal;
