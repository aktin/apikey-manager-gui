/**
 * Preload script for the Electron renderer process.
 *
 * Exposes a secure API (storeAPI) using contextBridge to allow controlled
 * access to persistent storage via ipcRenderer.
 *
 * Runs before the renderer loads, with contextIsolation enabled.
 *
 * @see https://www.electronjs.org/docs/latest/tutorial/context-isolation
 */
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("storeAPI", {
    get: (key: string) => ipcRenderer.invoke("store-get", key),
    set: (key: string, value: unknown) => ipcRenderer.invoke("store-set", key, value),
    delete: (key: string) => ipcRenderer.invoke("store-delete", key),
});
