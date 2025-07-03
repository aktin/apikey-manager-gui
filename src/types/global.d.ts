export {};

declare global {
    interface Window {
        storeAPI: {
            get: (key: string) => Promise<any>;
            set: (key: string, value: any) => void;
            delete: (key: string) => Promise<any>;
        };
    }
}