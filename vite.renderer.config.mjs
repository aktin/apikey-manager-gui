/**
 * Vite configuration for the Electron renderer process.
 *
 * Used by Electron Forge to compile the frontend (Vue.js) part of the app.
 * Applies Vue plugin to enable Single File Component (SFC) support.
 *
 * This config:
 * - Targets the Electron browser window (`mainWindow`)
 * - Is referenced by `@electron-forge/plugin-vite` in `forge.config.js`
 * - Should remain focused on frontend tooling only (no Node.js or Electron APIs)
 *
 * @see https://vitejs.dev/config/ — Vite documentation
 * @see https://electronforge.io/config/plugins/vite — Plugin usage
 */
import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()]
});
