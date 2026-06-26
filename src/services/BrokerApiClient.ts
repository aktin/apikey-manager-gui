import { BrokerCredentials } from "./BrokerCredentials";
import { ChangeNotifier } from "./ChangeNotifier";

/**
 * HTTP client for the AKTIN Broker REST API. Reads the live URL and admin key
 * from BrokerCredentials, and notifies listeners after the API-key set is
 * mutated (add/activate/deactivate).
 */
export class BrokerApiClient {
  private readonly apiKeysChanged = new ChangeNotifier();

  constructor(private readonly credentials: BrokerCredentials) {}

  onApiKeysChange(listener: () => Promise<void>): void {
    this.apiKeysChanged.on(listener);
  }

  async isConnected(): Promise<boolean> {
    try {
      const { url } = this.credentials.get();
      const response = await fetch(`${url}/broker/status`, { method: "GET" });
      return response.status === 200;
    } catch (error) {
      console.error("Failed to reach broker:", error);
      return false;
    }
  }

  /**
   * Authenticated GET/OPTIONS that returns the body only when the response
   * content type matches; on mismatch returns an empty body, and on network
   * error returns status 500 with an empty body.
   */
  private async request(
    pathSuffix: string,
    expectedContentType: string,
    label: string,
    method: "GET" | "OPTIONS" = "GET"
  ): Promise<{ status: number; data: string }> {
    try {
      const { url, adminApiKey } = this.credentials.get();
      const response = await fetch(`${url}${pathSuffix}`, {
        method,
        headers: {
          Authorization: `Bearer ${adminApiKey}`
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

  async getApiKeys(): Promise<{ status: number; data: string }> {
    const result = await this.request(
      "/api-keys",
      "text/plain",
      "API key list"
    );
    return { status: result.status, data: result.data.trimStart() };
  }

  async addApiKey(clinicCredentials: string): Promise<number> {
    try {
      const { url, adminApiKey } = this.credentials.get();
      const response = await fetch(`${url}/api-keys`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminApiKey}`,
          "Content-Type": "application/xml"
        },
        body: clinicCredentials
      });
      await this.apiKeysChanged.notify();
      return response.status;
    } catch (error) {
      console.error("Failed to add API key:", error);
      return 500;
    }
  }

  async activateApiKey(apiKey: string): Promise<number> {
    return this.toggleApiKey(apiKey, "activate");
  }

  async deactivateApiKey(apiKey: string): Promise<number> {
    return this.toggleApiKey(apiKey, "deactivate");
  }

  private async toggleApiKey(
    apiKey: string,
    action: "activate" | "deactivate"
  ): Promise<number> {
    try {
      const { url, adminApiKey } = this.credentials.get();
      const response = await fetch(`${url}/api-keys/${apiKey}/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminApiKey}`
        }
      });
      await this.apiKeysChanged.notify();
      return response.status;
    } catch (error) {
      console.error(`Failed to ${action} API key:`, error);
      return 500;
    }
  }

  async getBrokerNodeList(): Promise<{ status: number; data: string }> {
    return this.request("/broker/node/", "application/xml", "broker node list");
  }

  async getAllBrokerRequests(): Promise<{ status: number; data: string }> {
    return this.request(
      "/broker/request",
      "application/xml",
      "broker request list"
    );
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
