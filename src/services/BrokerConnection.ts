/**
 * Singleton class to manage communication with the AKTIN Broker.
 *
 * Responsibilities:
 * - Stores and manages broker connection credentials
 * - Provides methods for API key lifecycle operations (add, activate, deactivate)
 * - Emits change notifications to registered callback consumers
 * - Interfaces with the broker’s HTTP API for status and node metadata
 *
 * Credential State:
 * - Credentials must be initialized before any API operations
 * - Call `setCredentials()` once, then wait for `waitForBrokerCredentials()` in consumers
 *
 * Lifecycle Events:
 * - `onApiKeysChange(cb)` registers listeners for API key changes
 * - `onCredentialsChange(cb)` notifies when broker credentials are updated
 *
 */
// TODO: SIMPLIFY
class BrokerConnection {
  private static instance: BrokerConnection;
  private brokerURL = "";
  private adminApiKey = "";
  private apiKeysChangeCallbacks: Array<() => Promise<void>> = [];
  private credentialChangeCallbacks: Array<() => Promise<void>> = [];
  private credentialsInitialized = false;

  private nodeIdToCN = new Map<number, string>();

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

  public async waitForBrokerCredentials(timeoutMs = 5000): Promise<void> {
    const interval = 50;
    const maxTries = timeoutMs / interval;
    let tries = 0;
    while (!this.credentialsInitialized && tries < maxTries) {
      await new Promise((res) => setTimeout(res, interval));
      tries++;
    }
    if (!this.credentialsInitialized) {
      console.warn("Broker Credentials not initialized after timeout.");
    }
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
    this.credentialsInitialized = true;
    this.triggerCredentialChange();
  }

  public getCredentials(): { url: string; adminApiKey: string } {
    return { url: this.brokerURL, adminApiKey: this.adminApiKey };
  }

  public async isConnected(): Promise<boolean> {
    try {
      const response = await fetch(`${this.brokerURL}/broker/status`, {
        method: "GET"
      });
      return response.status === 200;
    } catch (error) {
      console.error("Failed to reach broker:", error);
      return false;
    }
  }

  private async request(
    pathSuffix: string,
    expectedContentType: string,
    label: string,
    method: "GET" | "OPTIONS" = "GET"
  ): Promise<{ status: number; data: string }> {
    try {
      const response = await fetch(`${this.brokerURL}${pathSuffix}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.adminApiKey}`
        }
      });
      const contentType = response.headers.get("Content-Type") || "";
      if (!contentType.includes(expectedContentType)) {
        console.warn(`Invalid ${label} received`);
        return { status: response.status, data: "" };
      }
      const text = await response.text();
      return { status: response.status, data: text };
    } catch (error) {
      console.error(`Failed to fetch ${label}:`, error);
      return { status: 500, data: "" };
    }
  }

  public async getApiKeys(): Promise<{ status: number; data: string }> {
    const result = await this.request(
      "/api-keys",
      "text/plain",
      "API key list"
    );
    return { status: result.status, data: result.data.trimStart() };
  }

  public async addApiKey(clinicCredentials: string): Promise<number> {
    try {
      const response = await fetch(`${this.brokerURL}/api-keys`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.adminApiKey}`,
          "Content-Type": "application/xml"
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

  private async toggleApiKey(
    apiKey: string,
    action: "activate" | "deactivate"
  ): Promise<number> {
    try {
      const response = await fetch(
        `${this.brokerURL}/api-keys/${apiKey}/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.adminApiKey}`
          }
        }
      );
      await this.triggerApiKeysChange();
      return response.status;
    } catch (error) {
      console.error(`Failed to ${action} API key:`, error);
      return 500;
    }
  }

  async getBrokerNodeList(): Promise<{ status: number; data: string }> {
    return this.request("/broker/node/", "application/xml", "broker node list");
  }

  public updateNodeCacheFromXml(xml: string): void {
    const ns = "http://aktin.org/ns/exchange";
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    const nodes = Array.from(doc.getElementsByTagNameNS(ns, "node"));
    this.nodeIdToCN.clear();
    for (const n of nodes) {
      const id = n.getElementsByTagNameNS(ns, "id")[0]?.textContent?.trim();
      const dn =
        n.getElementsByTagNameNS(ns, "clientDN")[0]?.textContent?.trim() ?? "";
      const cn =
        dn
          .split(",")
          .find((p) => p.startsWith("CN="))
          ?.slice(3) ?? null;
      if (id && cn) this.nodeIdToCN.set(Number(id), cn);
    }
  }

  public getCachedNodeCN(id: number): string | null {
    return this.nodeIdToCN.get(id) ?? null;
  }

  async getBrokerRequest(
    requestId: string
  ): Promise<{ status: number; data: string }> {
    return this.request(
      `/broker/request/${requestId}`,
      "application/vnd.aktin.query.request+xml",
      "broker request"
    );
  }

  async getBrokerRequestInfo(
    requestId: string
  ): Promise<{ status: number; data: string }> {
    return this.request(
      `/broker/request/${requestId}`,
      "application/xml",
      "broker request info",
      "OPTIONS"
    );
  }

  async getBrokerRequestStatus(
    requestId: string
  ): Promise<{ status: number; data: string }> {
    return this.request(
      `/broker/request/${requestId}/status`,
      "application/xml",
      "broker request status"
    );
  }

  async getBrokerRequestNodeStatus(
    requestId: string,
    nodeId: string
  ): Promise<{ status: number; data: string }> {
    return this.request(
      `/broker/request/${requestId}/status/${nodeId}`,
      "text/plain",
      "request node status"
    );
  }
}

// Export singleton instance
const connector = BrokerConnection.getInstance();
export default connector;
