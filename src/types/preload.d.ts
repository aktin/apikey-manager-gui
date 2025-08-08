/**
 * Type declarations for global APIs exposed by the Electron preload script.
 *
 * These APIs are made available on the `window` object via `contextBridge`:
 *
 * - `storeAPI`: Async key-value storage using Electron Store
 * - `profileCrypto`: AES-GCM encryption and decryption interface
 *
 * Declared as global so TypeScript understands their existence in the renderer process.
 *
 * @see src/preload.ts
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
  }
}
