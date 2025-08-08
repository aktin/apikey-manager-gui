/**
 * Vite configuration for the Electron main process.
 *
 * Defines how the main process script is bundled by Vite.
 * This script is responsible for managing the Electron app lifecycle,
 * window creation, and handling IPC.
 *
 * Key details:
 * - No UI code: no plugins like Vue are needed.
 * - Referenced by Electron Forge via `forge.config.js` with target `"main"`.
 * - Outputs to `.vite/build/`, typically loaded as `"main"` in `package.json`.
 * - External modules like `electron`, `keytar`, and Node.js built-ins are excluded from bundling.
 *
 * @see https://vitejs.dev/config/ — Vite config options
 * @see https://www.electronjs.org/docs/latest/tutorial/quick-start — Electron main process intro
 */
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  build: {
    target: "node20",
    outDir: ".vite/build",
    rollupOptions: {
      input: path.resolve(__dirname, "src/main.ts"),
      external: [
        "keytar",
        "electron",
        "crypto",
        "path",
        "fs"
      ],
    },
  },
});
