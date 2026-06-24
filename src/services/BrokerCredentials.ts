import { ChangeNotifier } from "./ChangeNotifier";

/**
 * Holds the broker URL and admin API key and signals listeners when they
 * change. Acts as the single source of truth other broker services read from.
 */
export class BrokerCredentials {
  private url = "";
  private adminApiKey = "";
  private initialized = false;
  private readonly changes = new ChangeNotifier();

  set(url: string, key: string): void {
    this.url = url;
    this.adminApiKey = key;
    this.initialized = true;
    void this.changes.notify();
  }

  get(): { url: string; adminApiKey: string } {
    return { url: this.url, adminApiKey: this.adminApiKey };
  }

  onChange(listener: () => Promise<void>): void {
    this.changes.on(listener);
  }

  /**
   * Resolves once credentials have been set, polling every 50ms up to
   * `timeoutMs`; logs a warning and resolves anyway once the timeout elapses.
   */
  async waitUntilReady(timeoutMs = 5000): Promise<void> {
    const interval = 50;
    const maxTries = timeoutMs / interval;
    let tries = 0;
    while (!this.initialized && tries < maxTries) {
      await new Promise((res) => setTimeout(res, interval));
      tries++;
    }
    if (!this.initialized) {
      console.warn("Broker Credentials not initialized after timeout.");
    }
  }
}
