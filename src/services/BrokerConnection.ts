/**
 * BrokerConnection
 *
 * Singleton service for managing communication with the AKTIN Broker.
 *
 * Responsibilities:
 * - Stores temporary connection credentials (`brokerURL`, `adminApiKey`) in memory.
 * - Provides methods to:
 *   - Check connection and authorization status.
 *   - Retrieve or modify API key lists.
 *   - Retrieve broker node metadata.
 *   - Activate or deactivate API keys.
 * - Supports registering a mutation callback (via `onUpdate`) to notify external components
 *   whenever the broker state has been changed (e.g. after adding or toggling keys).
 */
class BrokerConnection {
  private static instance: BrokerConnection;
  private brokerURL = "";
  private adminApiKey = "";
  private updateCallback?: () => Promise<void>;

  /**
   * Private constructor to enforce singleton usage.
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

  public getCredentials(): { url: string; adminApiKey: string } {
    return {url: this.brokerURL, adminApiKey: this.adminApiKey};
  }

  /**
   * Registers a callback to be triggered after broker-modifying operations
   * (e.g. `addApiKey`, `activateApiKey`, `deactivateApiKey`).
   *
   * @param {() => Promise<void>} callback - The async mutation callback.
   */
  public onUpdate(callback: () => Promise<void>): void {
    this.updateCallback = callback;
  }

  /**
   * Checks if the broker is reachable by sending a GET request to `/broker/status`.
   *
   * @returns {Promise<number>} The HTTP status code returned (200 if reachable).
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
   * Checks if the current API key is authorized to access broker resources.
   * Sends a GET request to `/broker/node/1`.
   *
   * @returns {Promise<boolean>} `true` if authorized (not 401), otherwise `false`.
   */
  public async isAuthorized(): Promise<boolean> {
    try {
      const response = await fetch(`${this.brokerURL}/broker/node/1`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.adminApiKey}`
        }
      });
      return response.status !== 401;
    } catch (error) {
      console.error("Authorization check failed:", error);
      return false;
    }
  }

  /**
   * Fetches all registered API keys from the broker.
   * If the response appears to be HTML, it is treated as an error.
   *
   * @returns {Promise<{ status: number; data: string }>} HTTP status and raw API key list.
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
   * Fetches the complete broker node list from `/broker/node/`.
   * The response is returned as raw XML data.
   *
   * @returns {Promise<{ status: number; data: string }>} HTTP status and node list.
   */
  public async getBrokerNodeList(): Promise<{ status: number; data: string }> {
    try {
      const response = await fetch(`${this.brokerURL}/broker/node/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.adminApiKey}`
        }
      });
      const text = await response.text();
      const trimmed = text.trimStart();
      const isHtml = trimmed.startsWith("<!DOCTYPE html>") || trimmed.startsWith("<html>");
      if (isHtml) {
        console.warn("Invalid broker node list received");
        return {status: 500, data: ""};
      }
      return {status: response.status, data: text};
    } catch (error) {
      console.error("Failed to fetch broker node list:", error);
      return {status: 500, data: ""};
    }
  }

  /**
   * Sends a POST request to add a new API key to the broker.
   * Accepts the full XML payload with `<ApiKey>` and `<clientDn>` tags.
   *
   * @param {string} clinicCredentials - XML payload with API key and client DN.
   * @returns {Promise<number>} The HTTP response status.
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

  /**
   * Internal method to toggle an API key's activation state.
   *
   * @private
   * @param {string} apiKey - The API key to toggle.
   * @param {"activate" | "deactivate"} action - The action to perform.
   * @returns {Promise<number>} The HTTP response status code.
   */
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

// Create and freeze singleton instance for global access.
const connector = BrokerConnection.getInstance();
Object.freeze(connector);

export default connector;
