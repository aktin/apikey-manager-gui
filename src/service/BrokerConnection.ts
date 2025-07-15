class BrokerConnection {
  private static instance: BrokerConnection;
  private brokerURL: string = "";
  private adminApiKey: string = "";
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

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

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.brokerURL = "";
      this.adminApiKey = "";
    }, 5 * 60 * 1000);
  }

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
      if (text.includes("<!doctype html>")) {
        throw new Error("No valid API Keys found.");
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
