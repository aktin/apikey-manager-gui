declare global {
  interface Window {
    storeAPI: {
      get: <T = unknown>(key: string) => Promise<T>;
      set: (key: string, value: unknown) => Promise<void>;
      delete: (key: string) => Promise<void>;
    };
  }
}
