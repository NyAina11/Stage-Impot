const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

function getIsDev() {
  return !!process.env.VITE_DEV_SERVER_URL;
}

function startBackend() {
  const isDev = getIsDev();
  if (isDev) return; // dev uses external server
  const serverDir = path.join(process.resourcesPath, 'server');
  const entry = path.join(serverDir, 'index.js');
  serverProcess = spawn(process.execPath, [entry], {
    cwd: serverDir,
    stdio: 'inherit'
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    try { serverProcess.kill(); } catch (_) {}
  }
});


