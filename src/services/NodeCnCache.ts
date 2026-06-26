import { parseXmlBrokerNodeList } from "../utils/Parser";

/**
 * Caches the mapping from broker node id to its certificate CN, rebuilt from
 * the broker node-list XML.
 */
export class NodeCnCache {
  private readonly nodeIdToCN = new Map<number, string>();

  /** Clears and repopulates the cache from a broker node-list XML document. */
  updateFromXml(xml: string): void {
    this.nodeIdToCN.clear();
    for (const { id, cn } of parseXmlBrokerNodeList(xml)) {
      if (cn && Number.isFinite(id)) this.nodeIdToCN.set(id, cn);
    }
  }

  get(id: number): string | null {
    return this.nodeIdToCN.get(id) ?? null;
  }
}
