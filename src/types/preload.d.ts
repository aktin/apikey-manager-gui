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
