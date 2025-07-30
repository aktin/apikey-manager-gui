/**
 * Vite configuration for the Electron main process.
 *
 * This file defines how Vite should bundle the Electron main script,
 * which initializes and controls the application lifecycle, windows, and IPC.
 *
 * Referenced in `forge.config.js` under the `build` section with target "main".
 *
 * Notes:
 * - No plugins are needed (no UI code involved)
 * - Can customize `build.target` and `outDir` for clarity
 *
 * @see https://vitejs.dev/config/
 * @see https://www.electronjs.org/docs/latest/tutorial/quick-start
 */
import {defineConfig} from 'vite';

export default defineConfig({});
