/**
 * Singleton facade over the broker services. Composes the credential state, the
 * HTTP API client, and the node-CN cache, and exposes them as one flat API so
 * components depend on a single object.
 *
 * Credential State:
 * - Call `setCredentials()` once, then await `waitForBrokerCredentials()` in consumers.
 *
 * Lifecycle Events:
 * - `onApiKeysChange(cb)` — the API-key set changed (add/activate/deactivate)
 * - `onCredentialsChange(cb)` — broker credentials were updated
 */
import { BrokerApiClient } from "./BrokerApiClient";
import { BrokerCredentials } from "./BrokerCredentials";
import { NodeCnCache } from "./NodeCnCache";

class BrokerConnection {
  private static instance: BrokerConnection;

  private readonly credentials = new BrokerCredentials();
  private readonly api = new BrokerApiClient(this.credentials);
  private readonly nodeCache = new NodeCnCache();

  static getInstance(): BrokerConnection {
    if (!BrokerConnection.instance) {
      BrokerConnection.instance = new BrokerConnection();
    }
    return BrokerConnection.instance;
  }

  setCredentials(url: string, key: string): void {
    this.credentials.set(url, key);
  }

  getCredentials(): { url: string; adminApiKey: string } {
    return this.credentials.get();
  }

  waitForBrokerCredentials(timeoutMs?: number): Promise<void> {
    return this.credentials.waitUntilReady(timeoutMs);
  }

  onCredentialsChange(callback: () => Promise<void>): void {
    this.credentials.onChange(callback);
  }

  onApiKeysChange(callback: () => Promise<void>): void {
    this.api.onApiKeysChange(callback);
  }

  isConnected(): Promise<boolean> {
    return this.api.isConnected();
  }

  getApiKeys(): Promise<{ status: number; data: string }> {
    return this.api.getApiKeys();
  }

  addApiKey(clinicCredentials: string): Promise<number> {
    return this.api.addApiKey(clinicCredentials);
  }

  activateApiKey(apiKey: string): Promise<number> {
    return this.api.activateApiKey(apiKey);
  }

  deactivateApiKey(apiKey: string): Promise<number> {
    return this.api.deactivateApiKey(apiKey);
  }

  getBrokerNodeList(): Promise<{ status: number; data: string }> {
    return this.api.getBrokerNodeList();
  }

  getBrokerNode(nodeId: string): Promise<{ status: number; data: string }> {
    return this.api.getBrokerNode(nodeId);
  }

  getBrokerNodeStats(
    nodeId: string
  ): Promise<{ status: number; data: string }> {
    return this.api.getBrokerNodeStats(nodeId);
  }

  getBrokerNodeResource(
    nodeId: string,
    path: string
  ): Promise<{ status: number; data: string }> {
    return this.api.getBrokerNodeResource(nodeId, path);
  }

  getAllBrokerRequests(): Promise<{ status: number; data: string }> {
    return this.api.getAllBrokerRequests();
  }

  getBrokerRequest(
    requestId: string
  ): Promise<{ status: number; data: string }> {
    return this.api.getBrokerRequest(requestId);
  }

  getBrokerRequestInfo(
    requestId: string
  ): Promise<{ status: number; data: string }> {
    return this.api.getBrokerRequestInfo(requestId);
  }

  getBrokerRequestStatus(
    requestId: string
  ): Promise<{ status: number; data: string }> {
    return this.api.getBrokerRequestStatus(requestId);
  }

  getBrokerRequestNodeStatus(
    requestId: string,
    nodeId: string
  ): Promise<{ status: number; data: string }> {
    return this.api.getBrokerRequestNodeStatus(requestId, nodeId);
  }

  /** Fetches the broker node list and repopulates the node-CN cache. */
  async refreshNodeCache(): Promise<void> {
    const result = await this.api.getBrokerNodeList();
    if (result.status === 200) {
      this.nodeCache.updateFromXml(result.data);
    }
  }

  updateNodeCacheFromXml(xml: string): void {
    this.nodeCache.updateFromXml(xml);
  }

  getCachedNodeCN(id: number): string | null {
    return this.nodeCache.get(id);
  }
}

// Export singleton instance
const connector = BrokerConnection.getInstance();
export default connector;
