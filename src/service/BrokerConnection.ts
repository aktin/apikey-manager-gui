/**
 * Singleton class to manage AKTIN Broker connection, API key actions, and status.
 * Holds temporary credentials in memory for 5 minutes and exposes async API calls.
 */
class BrokerConnection {
  private static instance: BrokerConnection;
  private brokerURL = "";
  private adminApiKey = "";

  private updateCallback?: () => Promise<void>;

  /**
   * Private constructor to enforce singleton.
   */
  private constructor() {
    if (BrokerConnection.instance) {
      return BrokerConnection.instance;
    }
    BrokerConnection.instance = this;
  }

  public static getInstance(): BrokerConnection {
    if (!BrokerConnection.instance) {
      BrokerConnection.instance = new BrokerConnection();
    }
    return BrokerConnection.instance;
  }

  public setCredentials(url: string, key: string): void {
    this.brokerURL = url;
    this.adminApiKey = key;
  }

  /**
   * Register a callback to be triggered after API modifications.
   */
  public onUpdate(callback: () => Promise<void>): void {
    this.updateCallback = callback;
  }

  /**
   * Check if the broker is reachable.
   */
  public async getBrokerStatus(): Promise<number> {
    try {
      const response = await fetch(`${this.brokerURL}/broker/status`, {method: "GET"});
      return response.status;
    } catch (error) {
      console.error("Failed to reach broker:", error);
      return 500;
    }
  }

  /**
   * Retrieve all API keys from the broker.
   */
  public async getApiKeys(): Promise<{ status: number; data: string }> {
    try {
      const response = await fetch(`${this.brokerURL}/api-keys`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.adminApiKey}`,
          "Content-Type": "application/json"
        }
      });
      const text = await response.text();
      const trimmed = text.trimStart();
      const isHtml = trimmed.startsWith("<!DOCTYPE html>") || trimmed.startsWith("<html>");
      if (isHtml) {
        console.warn("No valid API keys found");
        return {status: 500, data: ""};
      }
      return {status: response.status, data: text};
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      return {status: 500, data: ""};
    }
  }

  /**
   * Add a new API key (XML payload).
   */
  public async addApiKey(clinicCredentials: string): Promise<number> {
    try {
      const response = await fetch(`${this.brokerURL}/api-keys`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.adminApiKey}`,
          "Content-Type": "application/json"
        },
        body: clinicCredentials
      });
      if (this.updateCallback) {
        await this.updateCallback();
      }
      return response.status;
    } catch (error) {
      console.error("Failed to add API key:", error);
      return 500;
    }
  }

  public async activateApiKey(apiKey: string): Promise<number> {
    return this.toggleApiKey(apiKey, "activate");
  }

  public async deactivateApiKey(apiKey: string): Promise<number> {
    return this.toggleApiKey(apiKey, "deactivate");
  }

  private async toggleApiKey(apiKey: string, action: "activate" | "deactivate"): Promise<number> {
    try {
      const response = await fetch(`${this.brokerURL}/api-keys/${apiKey}/${action}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.adminApiKey}`
        }
      });
      if (this.updateCallback) {
        await this.updateCallback();
      }
      return response.status;
    } catch (error) {
      console.error(`Failed to ${action} API key:`, error);
      return 500;
    }
  }
}

const connector = BrokerConnection.getInstance();
Object.freeze(connector);

export default connector;
