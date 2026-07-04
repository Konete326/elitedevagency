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
