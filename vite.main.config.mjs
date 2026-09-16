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
 * - Everything else (electron-store, pg, …) is bundled: Forge packages only
 *   `.vite` and `package.json`, so node_modules are not available at runtime.
 *   `pg-native` stays external; pg only requires it lazily when `pg.native` is read.
 *
 * @see https://vitejs.dev/config/ — Vite config options
 * @see https://www.electronjs.org/docs/latest/tutorial/quick-start — Electron main process intro
 */
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  build: {
    target: "node22",
    outDir: ".vite/build",
    rollupOptions: {
      input: path.resolve(__dirname, "src/app/main.ts"),
      external: ["keytar", "pg-native", "electron", "crypto", "path", "fs"]
    }
  }
});
