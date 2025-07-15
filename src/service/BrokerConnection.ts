/**
 * Singleton class to manage broker connection, API keys, and status.
 */
class BrokerConnection {
  private static instance: BrokerConnection;
  private brokerURL = "";
  private adminApiKey = "";
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

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

  /**
   * Set broker URL and admin API key.
   * Credentials reset after 5 minutes.
   * @param url Broker URL
   * @param key Admin API key
   */
  public setCredentials(url: string, key: string): void {
    this.brokerURL = url;
    this.adminApiKey = key;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.brokerURL = "";
      this.adminApiKey = "";
    }, 5 * 60 * 1000);
  }

  /**
   * Check broker connection status.
   */
  public async getBrokerStatus(): Promise<number> {
    try {
      const response = await fetch(`${this.brokerURL}/broker/status`, {
        method: "GET"
      });
      return response.status;
    } catch (error) {
      console.error("Failed to reach broker:", error);
      return 500;
    }
  }

  /**
   * Fetch all API keys from broker.
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
      const isHtmlResponse = text.trimStart().startsWith("<!DOCTYPE html>") || text.trimStart().startsWith("<html>");
      if (isHtmlResponse) {
        console.warn("No valid API Keys found.");
        return {
          status: 0,
          data: ""
        };
      }
      return {
        status: response.status,
        data: text
      };
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      return {
        status: 0,
        data: ""
      };
    }
  }

  /**
   * Add new API key(s) to broker.
   * @param clinicCredentials XML payload
   */
  public async addApiKeys(clinicCredentials: string): Promise<number> {
    try {
      const response = await fetch(`${this.brokerURL}/api-keys`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.adminApiKey}`,
          "Content-Type": "application/xml"
        },
        body: clinicCredentials
      });
      if (window.callVueFunction) {
        await window.callVueFunction();
      }
      return response.status;
    } catch (error) {
      console.error("Failed to add API key:", error);
      return 500;
    }
  }

  /**
   * Activate a specific API key.
   * @param apiKey API key string
   */
  public async activateApiKey(apiKey: string): Promise<number> {
    return this.toggleApiKey(apiKey, "activate");
  }

  /**
   * Deactivate a specific API key.
   * @param apiKey API key string
   */
  public async deactivateApiKey(apiKey: string): Promise<number> {
    return this.toggleApiKey(apiKey, "deactivate");
  }

  /**
   * Toggle API key activation state.
   * @param apiKey API key
   * @param action 'activate' or 'deactivate'
   */
  private async toggleApiKey(apiKey: string, action: "activate" | "deactivate"): Promise<number> {
    try {
      const response = await fetch(`${this.brokerURL}/api-keys/${apiKey}/${action}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.adminApiKey}`
        }
      });
      if (window.callVueFunction) {
        await window.callVueFunction();
      }
      return response.status;
    } catch (error) {
      console.error(`Failed to ${action} API key`, error);
      return 500;
    }
  }
}

const connector = BrokerConnection.getInstance();
Object.freeze(connector);

export default connector;
