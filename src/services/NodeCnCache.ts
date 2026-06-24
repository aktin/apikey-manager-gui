/**
 * Caches the mapping from broker node id to its certificate CN, rebuilt from
 * the broker node-list XML.
 */
export class NodeCnCache {
  private readonly nodeIdToCN = new Map<number, string>();

  /** Clears and repopulates the cache from a broker node-list XML document. */
  updateFromXml(xml: string): void {
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

  get(id: number): string | null {
    return this.nodeIdToCN.get(id) ?? null;
  }
}
