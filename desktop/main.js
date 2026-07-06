const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL('http://localhost:5173');
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('get-device-id', async () => {
    return 'HARDWARE-UUID-MOCK-12345';
  });

  ipcMain.handle('get-printers', async () => {
    return mainWindow.webContents.getPrintersAsync();
  });

  ipcMain.handle('print-receipt', async (event, payload) => {
    console.log(payload);
    return { success: true };
  });

  ipcMain.handle('print-barcode', async (event, payload) => {
    console.log(payload);
    return { success: true };
  });

  ipcMain.handle('print-kot', async (event, payload) => {
    console.log(payload);
    return { success: true };
  });
});
