class BrokerConnection {
  private static instance: BrokerConnection;
  private brokerURL = "";
  private adminApiKey = "";
  private updateCallbacks: Array<() => Promise<void>> = [];

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

  public onUpdate(callback: () => Promise<void>): void {
    this.updateCallbacks.push(callback);
  }

  private async triggerUpdateCallbacks(): Promise<void> {
    for (const cb of this.updateCallbacks) {
      await cb();
    }
  }

  public async getBrokerStatus(): Promise<number> {
    try {
      const response = await fetch(`${this.brokerURL}/broker/status`, {method: "GET"});
      return response.status;
    } catch (error) {
      console.error("Failed to reach broker:", error);
      return 500;
    }
  }

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
      if (this.updateCallbacks.length) {
        await this.triggerUpdateCallbacks();
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
      if (this.updateCallbacks.length) {
        await this.triggerUpdateCallbacks();
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
