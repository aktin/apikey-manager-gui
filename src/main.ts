/**
 * Main process entry point for the Electron app.
 *
 * Bootstraps the application by:
 * - Creating the main browser window
 * - Handling IPC for secure data access and encryption
 * - Registering lifecycle events (e.g. window restore, quit behavior)
 *
 * Integrates with:
 * - Electron Forge (Vite plugin)
 * - electron-store for persistent key-value storage
 * - ProfileEncryptionBridge for AES-GCM encryption
 */
import {app, BrowserWindow, ipcMain, screen} from "electron";
import path from "node:path";
import Store from "electron-store";
import {decrypt, encrypt} from "./services/ProfileEncryptionBridge";

const store = new Store();

// IPC handlers for secure key-value storage
ipcMain.handle("store-get", (_event, key: string) => store.get(key));
ipcMain.handle("store-set", (_event, key: string, value: unknown) => store.set(key, value));
ipcMain.handle("store-delete", (_event, key: string) => store.delete(key));

// IPC handlers for encryption bridge
ipcMain.handle("encrypt", async (_event, plainText: string) => {
  return await encrypt(plainText);
});
ipcMain.handle("decrypt", async (_event, encryptedText: string) => {
  return await decrypt(encryptedText);
});

// Creates and configures the main application window.
const createWindow = () => {
  const {width, height} = screen.getPrimaryDisplay().workAreaSize;
  const mainWindow = new BrowserWindow({
    width,
    height,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
        path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
};

// Lifecycle: app ready
app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Lifecycle: quit on all windows closed (except macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
