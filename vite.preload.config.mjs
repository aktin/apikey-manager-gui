/**
 * Vite configuration for the Electron preload script.
 *
 * Used to bundle the preload script, which exposes secure IPC APIs
 * from the main process to the renderer using `contextBridge`.
 *
 * Key characteristics:
 * - No UI or framework code: this file does not use Vue or other plugins.
 * - Referenced by `@electron-forge/plugin-vite` with target `"preload"` in `forge.config.js`.
 * - Output is included in the Electron `webPreferences.preload` setting.
 *
 * @see https://vitejs.dev/config/ — Vite configuration docs
 * @see https://www.electronjs.org/docs/latest/tutorial/context-isolation — Context isolation guide
 */
import {defineConfig} from 'vite';

export default defineConfig({});
