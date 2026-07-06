const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getDeviceId: () => ipcRenderer.invoke('get-device-id'),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printReceipt: (payload) => ipcRenderer.invoke('print-receipt', payload),
  printBarcode: (payload) => ipcRenderer.invoke('print-barcode', payload),
  printKOT: (orderData, mode) => ipcRenderer.invoke('print-kot', { orderData, mode })
});
