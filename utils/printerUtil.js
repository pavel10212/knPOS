import { PermissionsAndroid } from "react-native";
import { Image } from 'react-native';
import {
  COMMANDS,
  BLEPrinter,
} from "react-native-thermal-receipt-printer-image-qr";

const initializePrinter = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      await BLEPrinter.init();
      const devices = await BLEPrinter.getDeviceList();
      const targetPrinter = devices.find(
        (device) => device.device_name === "KPrinter_fd35"
      );
      if (targetPrinter) {
        await BLEPrinter.connectPrinter(targetPrinter.inner_mac_address);
        return true;
      } else {
        throw new Error("Printer KPrinter_fd35 not found");
      }
    } else {
      throw new Error("Bluetooth permission denied");
    }
  } catch (error) {
    console.error("Printer initialization failed:", error);
    throw error;
  }
};

const printQRCode = async (base64Data, tableNumber) => {
  const BOLD_ON = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON;
  const BOLD_OFF = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF;
  const CENTER = COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT;

  BLEPrinter.printText(`${CENTER}${BOLD_ON}QR Code Details${BOLD_OFF}\n\n`);
  BLEPrinter.printText(`${CENTER}Table ${tableNumber}\n\n`);
  BLEPrinter.printImageBase64(base64Data, {
    imageWidth: 400,
    imageHeight: 400,
  });
};

const printReceipt = async (orderDetails, paymentDetails) => {
  const CENTER = COMMANDS.TEXT_FORMAT.TXT_ALIGN_CT;
  const LEFT = COMMANDS.TEXT_FORMAT.TXT_ALIGN_LT;
  const BOLD_ON = COMMANDS.TEXT_FORMAT.TXT_BOLD_ON;
  const BOLD_OFF = COMMANDS.TEXT_FORMAT.TXT_BOLD_OFF;

  // Print header
  BLEPrinter.printText(`${CENTER}${BOLD_ON}KhinKali House${BOLD_OFF}\n`);
  BLEPrinter.printText(`${CENTER}================================\n\n`);

  // Print order details
  BLEPrinter.printText(`${LEFT}Table: ${orderDetails.tableNumber}\n`);
  BLEPrinter.printText(`Date: ${new Date().toLocaleString()}\n\n`);

  // Print items
  BLEPrinter.printText(`${LEFT}${BOLD_ON}ITEMS${BOLD_OFF}\n`);
  BLEPrinter.printText(`--------------------------------\n`);
  orderDetails.items.forEach(async (item) => {
    BLEPrinter.printText(
      `${item.name}\n` +
        `${item.quantity} x $${item.price.toFixed(2)}    $${(
          item.quantity * item.price
        ).toFixed(2)}\n`
    );
  });
  BLEPrinter.printText(`--------------------------------\n\n`);

  // Print payment details
  BLEPrinter.printText(
    `${LEFT}Subtotal: $${paymentDetails.subtotal.toFixed(2)}\n`
  );
  if (paymentDetails.discount > 0) {
    BLEPrinter.printText(
      `Discount (${
        paymentDetails.discount
      }%): -$${paymentDetails.discountAmount.toFixed(2)}\n`
    );
  }
  BLEPrinter.printText(`VAT (10%): $${paymentDetails.vat.toFixed(2)}\n`);
  BLEPrinter.printText(
    `${BOLD_ON}Total: $${paymentDetails.total.toFixed(2)}${BOLD_OFF}\n\n`
  );

  if (paymentDetails.tipAmount > 0) {
    BLEPrinter.printText(
      `Tip Amount: $${paymentDetails.tipAmount.toFixed(2)}\n\n`
    );
  }

  // Handle different payment methods
  if (paymentDetails.method === "qr") {
    BLEPrinter.printText(`${CENTER}${BOLD_ON}Scan QR to Pay${BOLD_OFF}\n\n`);
    // Print QR code image
    const qrImagePath = require("../assets/images/qrCode.jpg")
    const qrBase64 = await convertImageToBase64(qrImagePath);
    BLEPrinter.printImageBase64(qrBase64, {
        imageWidth: 400,
        imageHeight: 400,
    });
  }

  // Print footer
  BLEPrinter.printText(`\n${CENTER}Thank you for your visit!\n`);
  BLEPrinter.printText(`${CENTER}================================\n\n\n`);
};

const convertImageToBase64 = (imagePath) => {
  return new Promise((resolve, reject) => {
    const image = Image.resolveAssetSource(imagePath);
    if (!image) {
      reject(new Error('Could not resolve image asset'));
      return;
    }
    
    // For local assets, the uri property contains the path
    const imageUri = image.uri;
    
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = reject;
    xhr.open('GET', imageUri);
    xhr.responseType = 'blob';
    xhr.send();
  });
};

export { initializePrinter, printQRCode, printReceipt };
