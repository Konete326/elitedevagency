export const getDeviceFingerprint = async () => {
  if (window.electronAPI && window.electronAPI.getDeviceId) {
    return await window.electronAPI.getDeviceId();
  }
  
  let deviceId = localStorage.getItem('mock_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('mock_device_id', deviceId);
  }
  return deviceId;
};

export const getSystemPrinters = async () => {
  if (window.electronAPI && window.electronAPI.getPrinters) {
    return await window.electronAPI.getPrinters();
  }
  return [
    { name: 'Mock Thermal POS-58', isDefault: true },
    { name: 'Mock Thermal POS-80', isDefault: false },
    { name: 'Mock Office Laser Jet', isDefault: false }
  ];
};

export const printHardwareReceipt = async (payload) => {
  if (window.electronAPI && window.electronAPI.printReceipt) {
    return await window.electronAPI.printReceipt(payload);
  }
  console.log(payload);
  return { success: true };
};

export const printHardwareBarcode = async (productName, variantDesc, price, barcode) => {
  if (window.electronAPI && window.electronAPI.printBarcode) {
    return await window.electronAPI.printBarcode({ productName, variantDesc, price, barcode });
  }
  console.log("Mock Barcode Print", { productName, variantDesc, price, barcode });
  return { success: true };
};

export const printKOT = async (orderData, mode) => {
  if (window.electronAPI && window.electronAPI.printKOT) {
    return await window.electronAPI.printKOT(orderData, mode);
  }
  console.log("Mock KOT Print", { orderData, mode });
  return { success: true };
};
