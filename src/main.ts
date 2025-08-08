/**
 * Main process entry point for the Electron app.
 *
 * Initializes the application, sets up the main window, and handles IPC for
 * persistent storage via electron-store.
 *
 * Uses Electron Forge with Vite plugin for dev/prod compatibility.
 */

import {app, BrowserWindow, ipcMain} from "electron";
import path from "node:path";
import Store from "electron-store";
import {decrypt, encrypt} from "./services/ProfileEncryptionBridge";

const store = new Store();

ipcMain.handle("store-get", (_event, key: string) => store.get(key));
ipcMain.handle("store-set", (_event, key: string, value: unknown) => store.set(key, value));
ipcMain.handle("store-delete", (_event, key: string) => store.delete(key));
ipcMain.handle("encrypt", async (_event, plainText: string) => {
  return await encrypt(plainText);
});
ipcMain.handle("decrypt", async (_event, encryptedText: string) => {
  return await decrypt(encryptedText);
});


const createWindow = () => {
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.maximize();

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
