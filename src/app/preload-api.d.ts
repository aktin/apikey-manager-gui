/**
 * Type declarations for global APIs exposed by the Electron preload script.
 *
 * These APIs are made available on the `window` object via `contextBridge`:
 *
 * - `storeAPI`: Async key-value storage using Electron Store
 * - `profileCrypto`: AES-GCM encryption and decryption interface
 * - `queryBuilderFiles`: Query-builder catalog and saved-query files in userData
 *
 * Declared as global so TypeScript understands their existence in the renderer process.
 *
 * @see src/app/preload.ts
 */
export {};

declare global {
  interface Window {
    storeAPI: {
      get: (key: string) => Promise<unknown>;
      set: (key: string, value: unknown) => Promise<void>;
      delete: (key: string) => Promise<void>;
    };
    profileCrypto: {
      encrypt: (text: string) => Promise<string>;
      decrypt: (text: string) => Promise<string>;
    };
    queryBuilderFiles: {
      readCatalog: () => Promise<string | null>;
      writeCatalog: (content: string) => Promise<void>;
      listQueries: () => Promise<string[]>;
      readQuery: (name: string) => Promise<string | null>;
      readQueryState: (name: string) => Promise<string | null>;
      writeQuery: (name: string, xml: string, state: string) => Promise<void>;
      deleteQuery: (name: string) => Promise<void>;
    };
  }
}
