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
import { app, BrowserWindow, ipcMain, screen } from "electron";
import path from "node:path";
import { promises as fs } from "node:fs";
import Store from "electron-store";
import { decrypt, encrypt } from "../profiles/ProfileEncryptionBridge";
import { isValidQueryName } from "../querybuilder/QueryName";

const store = new Store();

// IPC handlers for secure key-value storage
ipcMain.handle("store-get", (_event, key: string) => store.get(key));
ipcMain.handle("store-set", (_event, key: string, value: unknown) =>
  store.set(key, value)
);
ipcMain.handle("store-delete", (_event, key: string) => store.delete(key));

// IPC handlers for encryption bridge
ipcMain.handle("encrypt", (_event, plainText: string) => encrypt(plainText));
ipcMain.handle("decrypt", (_event, encryptedText: string) =>
  decrypt(encryptedText)
);

// File storage for the query builder: the block catalog and saved query XMLs
// live under userData so they never enter the (public) repository.
const queryBuilderDir = () =>
  path.join(app.getPath("userData"), "querybuilder");
const queriesDir = () => path.join(queryBuilderDir(), "queries");
const catalogFile = () => path.join(queryBuilderDir(), "catalog.json");

/**
 * Resolves a query name and file suffix to a file path, so renderer input can
 * never escape the queries folder: the shared name validation (plain file name,
 * no Windows-reserved device names) is authoritative here, plus a containment
 * check on the resolved path as defense in depth.
 */
function resolveQueryFile(name: string, suffix: string): string {
  if (!isValidQueryName(name)) {
    throw new Error("Invalid query name");
  }
  const base = path.resolve(queriesDir());
  const filePath = path.resolve(base, `${name}${suffix}`);
  if (!filePath.startsWith(base + path.sep)) {
    throw new Error("Invalid query name");
  }
  return filePath;
}

async function readTextFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

// IPC handlers for query-builder files
ipcMain.handle("querybuilder-read-catalog", () => readTextFile(catalogFile()));
ipcMain.handle(
  "querybuilder-write-catalog",
  async (_event, content: string) => {
    await fs.mkdir(queryBuilderDir(), { recursive: true });
    await fs.writeFile(catalogFile(), content, "utf-8");
  }
);
ipcMain.handle("querybuilder-list-queries", async () => {
  try {
    // withFileTypes so symlinks and directories are skipped, not followed.
    const entries = await fs.readdir(queriesDir(), { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".xml"))
      .map((entry) => entry.name.slice(0, -".xml".length))
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
});
ipcMain.handle("querybuilder-read-query", (_event, name: string) =>
  readTextFile(resolveQueryFile(name, ".xml"))
);
ipcMain.handle("querybuilder-read-query-state", (_event, name: string) =>
  readTextFile(resolveQueryFile(name, ".json"))
);
// The XML and the builder state that produced it are written as a pair, so a
// saved query can be loaded back into the builder.
ipcMain.handle(
  "querybuilder-write-query",
  async (_event, name: string, xml: string, state: string) => {
    const xmlFile = resolveQueryFile(name, ".xml");
    const stateFile = resolveQueryFile(name, ".json");
    await fs.mkdir(queriesDir(), { recursive: true });
    await fs.writeFile(xmlFile, xml, "utf-8");
    await fs.writeFile(stateFile, state, "utf-8");
  }
);
ipcMain.handle("querybuilder-delete-query", async (_event, name: string) => {
  // Removes the query together with its builder state.
  for (const suffix of [".xml", ".json"]) {
    try {
      // unlink only removes files, never directories; a missing file is fine.
      await fs.unlink(resolveQueryFile(name, suffix));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
});

// Creates and configures the main application window.
const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
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
