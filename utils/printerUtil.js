import { PermissionsAndroid, Platform, Alert } from "react-native";
import { Image } from "react-native";
import {
  COMMANDS,
  BLEPrinter,
} from "react-native-thermal-receipt-printer-image-qr";

// Add a connection state tracker
let isPrinterConnected = false;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// Add a write queue to prevent concurrent writes
const printQueue = [];
let isProcessingQueue = false;

// Avoid crashing the app during initialization
const initializePrinter = async (forceReconnect = false) => {
  try {
    // If already connected and not forcing reconnect, return
    if (isPrinterConnected && !forceReconnect) {
      console.log("Printer already connected, skipping initialization");
      return true;
    }

    // Reset connection if forcing reconnect
    if (forceReconnect) {
      try {
        console.log("Force reconnecting printer...");
        await BLEPrinter.closeConn();
        isPrinterConnected = false;
        connectionAttempts = 0;
      } catch (closeError) {
        console.log("Error while closing previous connection:", closeError);
        // Continue anyway
      }
    }
    
    // Request permissions only on Android
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.error("Bluetooth permission denied");
          throw new Error("Bluetooth permission denied");
        }
      } catch (permissionError) {
        console.error("Error requesting Bluetooth permission:", permissionError);
        return false;
      }
    }
    
    // Initialize the printer module with timeout
    try {
      await Promise.race([
        BLEPrinter.init(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Printer initialization timeout")), 5000)
        )
      ]);
    } catch (initError) {
      console.error("Printer module initialization failed:", initError);
      return false;
    }
    
    // Get available devices
    let devices = [];
    try {
      devices = await Promise.race([
        BLEPrinter.getDeviceList(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Get device list timeout")), 5000)
        )
      ]);
      console.log("Available Bluetooth devices:", devices);
    } catch (deviceListError) {
      console.error("Failed to get device list:", deviceListError);
      return false;
    }
    
    const targetPrinter = devices.find(
      (device) => device.device_name === "KPrinter_fd35"
    );
    
    if (!targetPrinter) {
      console.error("Printer KPrinter_fd35 not found in device list");
      return false;
    }
    
    // Attempt to connect with better error handling
    try {
      // Always close any existing connection first
      try {
        await Promise.race([
          BLEPrinter.closeConn(),
          new Promise((resolve) => setTimeout(resolve, 1000))
        ]);
      } catch (closeError) {
        console.log("Error while closing previous connection:", closeError);
        // Continue anyway
      }
      
      // Short delay before reconnecting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Connect with timeout
      await Promise.race([
        BLEPrinter.connectPrinter(targetPrinter.inner_mac_address),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Printer connection timeout")), 5000)
        )
      ]);
      
      console.log("Successfully connected to printer:", targetPrinter.device_name);
      isPrinterConnected = true;
      connectionAttempts = 0;
      
      return true;
    } catch (connectionError) {
      console.error("Failed to connect to printer:", connectionError);
      isPrinterConnected = false;
      return false;
    }
  } catch (error) {
    console.error("Printer initialization failed:", error);
    isPrinterConnected = false;
    connectionAttempts++;
    return false;
  }
};

// Helper function to ensure printer is connected before printing with retry logic
const ensurePrinterConnection = async () => {
  if (!isPrinterConnected || connectionAttempts > 0) {
    console.log("Printer not connected or had previous connection issues, attempting to reconnect...");
    // If we've tried too many times, force a full reconnection
    const forceReconnect = connectionAttempts >= MAX_RECONNECT_ATTEMPTS;
    const connected = await initializePrinter(forceReconnect);
    
    if (!connected) {
      console.error("Could not establish printer connection after attempts");
      throw new Error("Could not establish printer connection");
    }
  }
  return true;
};

// Wrap BLEPrinter.printText with error handling and queue management
const safePrintText = async (text) => {
  return new Promise((resolve, reject) => {
    printQueue.push({
      type: 'text',
      content: text,
      resolve,
      reject
    });
    
    processPrintQueue();
  });
};

// Wrap BLEPrinter.printImageBase64 with error handling and queue management
const safePrintImageBase64 = async (base64Data, options) => {
  return new Promise((resolve, reject) => {
    printQueue.push({
      type: 'image',
      content: base64Data,
      options,
      resolve,
      reject
    });
    
    processPrintQueue();
  });
};

// Process the print queue sequentially
const processPrintQueue = async () => {
  if (isProcessingQueue || printQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  try {
    await ensurePrinterConnection();
    
    while (printQueue.length > 0) {
      const job = printQueue.shift();
      
      try {
        // Add timeouts to each print operation
        if (job.type === 'text') {
          await Promise.race([
            BLEPrinter.printText(job.content),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Print text timeout")), 5000)
            )
          ]);
        } else if (job.type === 'image') {
          await Promise.race([
            BLEPrinter.printImageBase64(job.content, job.options),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Print image timeout")), 10000)
            )
          ]);
        }
        job.resolve(true);
      } catch (error) {
        console.error(`Error during printing ${job.type}:`, error);
        
        // Attempt to recover the connection
        try {
          const reconnected = await initializePrinter(true);
          
          if (reconnected) {
            // Retry the failed job once
            if (job.type === 'text') {
              await Promise.race([
                BLEPrinter.printText(job.content),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error("Print text retry timeout")), 5000)
                )
              ]);
            } else if (job.type === 'image') {
              await Promise.race([
                BLEPrinter.printImageBase64(job.content, job.options),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error("Print image retry timeout")), 10000)
                )
              ]);
            }
            job.resolve(true);
          } else {
            job.reject(new Error("Failed to reconnect printer"));
          }
        } catch (retryError) {
          job.reject(retryError);
        }
      }
      
      // Small delay between print jobs
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  } catch (error) {
    console.error("Error processing print queue:", error);
    // Reject all remaining jobs in the queue
    while (printQueue.length > 0) {
      const job = printQueue.shift();
      job.reject(error);
    }
  } finally {
    isProcessingQueue = false;
  }
};

const printQRCode = async (base64Data, tableNumber) => {
  try {
    const connected = await ensurePrinterConnection();
    if (!connected) {
      Alert.alert(
        "Printer Not Available", 
        "Could not connect to the printer. Try switching to a mobile hotspot network or check printer power."
      );
      return false;
    }
    
    const CENTER = COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT;
    const BOLD_ON = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON;
    const BOLD_OFF = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF;

    await safePrintText(`${CENTER}${BOLD_ON}KhinKali House${BOLD_OFF}\n`);
    await safePrintText(`${CENTER}${BOLD_ON}QR Code Details${BOLD_OFF}\n\n`);
    await safePrintText(`${CENTER}Table ${tableNumber}\n\n`);
    await safePrintImageBase64(base64Data, {
      imageWidth: 400,
      imageHeight: 400,
    });
    return true;
  } catch (error) {
    console.error("Error printing QR code:", error);
    Alert.alert(
      "Printer Error", 
      "Failed to print QR code. Try switching to a mobile hotspot network or check printer power."
    );
    return false;
  }
};

const printReceipt = async (orderDetails, paymentDetails) => {
  try {
    const connected = await ensurePrinterConnection();
    if (!connected) {
      Alert.alert(
        "Printer Not Available", 
        "Could not connect to the printer. Try switching to a mobile hotspot network or check printer power."
      );
      return false;
    }
    
    const CENTER = COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT;
    const LEFT = COMMANDS.TEXT_FORMAT.TXT_ALIGN_LT;
    const BOLD_ON = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON;
    const BOLD_OFF = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF;

    // Print header
    await safePrintText(`${CENTER}${BOLD_ON}KhinKali House${BOLD_OFF}\n`);
    await safePrintText(`${CENTER}================================\n\n`);

    // Print order details
    await safePrintText(`${LEFT}Table: ${orderDetails.tableNumber}\n`);
    await safePrintText(`${LEFT}Date: ${new Date().toLocaleString()}\n\n`);

    // Print items
    await safePrintText(`${LEFT}${BOLD_ON}ITEMS${BOLD_OFF}\n`);
    await safePrintText(`--------------------------------\n`);
    
    // Print each item sequentially to avoid race conditions
    for (const item of orderDetails.items) {
      await safePrintText(
        `${item.name}\n` +
        `${item.quantity} x $${item.price.toFixed(2)}    $${(
          item.quantity * item.price
        ).toFixed(2)}\n`
      );
    }
    
    await safePrintText(`--------------------------------\n\n`);

    // Print payment details
    await safePrintText(`${LEFT}Subtotal: $${paymentDetails.subtotal.toFixed(2)}\n`);
    
    if (paymentDetails.discount > 0) {
      await safePrintText(
        `Discount (${
          paymentDetails.discount
        }%): -$${paymentDetails.discountAmount.toFixed(2)}\n`
      );
    }
    
    await safePrintText(`VAT (${paymentDetails.vatRate}%): $${paymentDetails.vat.toFixed(2)}\n`);
    await safePrintText(
      `${BOLD_ON}Total: $${paymentDetails.total.toFixed(2)}${BOLD_OFF}\n\n`
    );

    // Handle different payment methods
    await safePrintText(`${CENTER}${BOLD_ON}Scan QR to Pay${BOLD_OFF}\n\n`);
    
    // Print QR code image
    const qrImagePath = require("../assets/images/qrCode.jpg");
    const qrBase64 = await convertImageToBase64(qrImagePath);
    
    await safePrintImageBase64(qrBase64, {
      imageWidth: 400,
      imageHeight: 400,
    });

    // Print footer
    await safePrintText(`\n${CENTER}Thank you for your visit!\n`);
    await safePrintText(`${CENTER}================================\n\n\n`);
    
    return true;
  } catch (error) {
    console.error("Error printing receipt:", error);
    Alert.alert(
      "Printer Error", 
      "Failed to print receipt. Try switching to a mobile hotspot network or check printer power."
    );
    return false;
  }
};

const convertImageToBase64 = (imagePath) => {
  return new Promise((resolve, reject) => {
    const image = Image.resolveAssetSource(imagePath);
    if (!image) {
      reject(new Error("Could not resolve image asset"));
      return;
    }

    // For local assets, the uri property contains the path
    const imageUri = image.uri;

    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(",")[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = reject;
    xhr.open("GET", imageUri);
    xhr.responseType = "blob";
    xhr.send();
  });
};

// Add function to disconnect printer
const disconnectPrinter = async () => {
  try {
    await BLEPrinter.closeConn();
    isPrinterConnected = false;
    connectionAttempts = 0;
    console.log("Printer disconnected successfully");
    return true;
  } catch (error) {
    console.error("Error disconnecting printer:", error);
    return false;
  }
};

export { initializePrinter, printQRCode, printReceipt, disconnectPrinter };
