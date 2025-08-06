class BrokerConnection {
  private static instance: BrokerConnection;
  private brokerURL = "";
  private adminApiKey = "";
  private apiKeysChangeCallbacks: Array<() => Promise<void>> = [];
  private credentialChangeCallbacks: Array<() => Promise<void>> = [];

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

  public onApiKeysChange(callback: () => Promise<void>): void {
    this.apiKeysChangeCallbacks.push(callback);
  }

  public onCredentialsChange(callback: () => Promise<void>): void {
    this.credentialChangeCallbacks.push(callback);
  }

  private async triggerApiKeysChange(): Promise<void> {
    for (const cb of this.apiKeysChangeCallbacks) {
      await cb();
    }
  }

  private async triggerCredentialChange(): Promise<void> {
    for (const cb of this.credentialChangeCallbacks) {
      await cb();
    }
  }

  public setCredentials(url: string, key: string): void {
    this.brokerURL = url;
    this.adminApiKey = key;
    await this.triggerCredentialChange();
  }

  public getCredentials(): { url: string; adminApiKey: string } {
    return {url: this.brokerURL, adminApiKey: this.adminApiKey};
  }

  public async isConnected(): Promise<boolean> {
    try {
      const response = await fetch(`${this.brokerURL}/broker/status`, {
        method: "GET",
      });
      return response.status === 200;
    } catch (error) {
      console.error("Failed to reach broker:", error);
      return false;
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
      await this.triggerApiKeysChange();
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
      await this.triggerApiKeysChange();
      return response.status;
    } catch (error) {
      console.error(`Failed to ${action} API key:`, error);
      return 500;
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
}

// Create and freeze singleton instance for global access.
const connector = BrokerConnection.getInstance();
Object.freeze(connector);

export default connector;
