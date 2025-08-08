/**
 * Preload script for the Electron renderer process.
 *
 * Runs in a separate context before the web page loads.
 * Exposes secure APIs (`storeAPI`, `profileCrypto`) from the main process
 * using `contextBridge`, allowing safe IPC access from the renderer.
 *
 * Required for contextIsolation to safely enable communication between
 * untrusted renderer code and privileged Node.js APIs.
 *
 * @see https://www.electronjs.org/docs/latest/tutorial/context-isolation
 */
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("storeAPI", {
  get: (key: string) => ipcRenderer.invoke("store-get", key),
  set: (key: string, value: unknown) => ipcRenderer.invoke("store-set", key, value),
  delete: (key: string) => ipcRenderer.invoke("store-delete", key),
});

contextBridge.exposeInMainWorld("profileCrypto", {
  encrypt: (text: string) => ipcRenderer.invoke("encrypt", text),
  decrypt: (text: string) => ipcRenderer.invoke("decrypt", text),
});
