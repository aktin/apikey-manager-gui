/**
 * Vite configuration for the Electron preload script.
 *
 * This file defines how Vite should build the preload script used to expose
 * secure APIs via contextBridge to the renderer process.
 *
 * Referenced in `forge.config.js` under the `build` section with target "preload".
 *
 * Notes:
 * - No plugins are needed (no Vue or UI code here)
 * - Can be extended to customize output directory, target, etc.
 *
 * @see https://vitejs.dev/config/
 * @see https://www.electronjs.org/docs/latest/tutorial/context-isolation
 */
import {defineConfig} from 'vite';

export default defineConfig({});
