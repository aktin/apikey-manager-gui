/**
 * Vite configuration for the Electron renderer process.
 *
 * This file is used by @electron-forge/plugin-vite to build the renderer (frontend)
 * part of the Electron application. It enables support for Vue 3 Single File Components
 * and applies any renderer-specific build settings.
 *
 * Referenced in `forge.config.js` under the `renderer` entry.
 *
 * Note:
 * - This config targets the Electron browser window (`mainWindow`)
 * - Keep this config lightweight and scoped to frontend-only plugins
 *
 * @see https://vitejs.dev/config/
 * @see https://electronforge.io/config/plugins/vite
 */
import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()]
});
