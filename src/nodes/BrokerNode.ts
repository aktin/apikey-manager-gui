/**
 * Domain model for broker nodes: list entries, a node's full metadata, its
 * import statistics, and a generic key/value resource entry. Parsed from broker
 * XML by the node parsers in `Parser`.
 */

/** One entry of the broker node list (`GET /broker/node/`). */
export interface NodeListEntry {
  id: number;
  cn: string | null;
  lastContact: Date | null;
}

/** A single broker node with full metadata (`GET /broker/node/{id}`). */
export interface BrokerNode {
  id: number;
  cn: string | null;
  o: string | null;
  l: string | null;
  lastContact: Date | null;
  websocket: boolean;
  modules: string[];
}

/** One recorded import error, with how often it repeated and when it last occurred. */
export interface NodeError {
  message: string;
  repeats: number | null;
  timestamp: Date | null;
}

/** Import statistics of a node (`GET /broker/node/{id}/stats`). */
export interface NodeStats {
  start: Date | null;
  lastWrite: Date | null;
  lastReject: Date | null;
  imported: number;
  updated: number;
  invalid: number;
  failed: number;
  lastErrors: NodeError[];
}

/**
 * One key/value pair from a node properties resource (versions, import-scripts,
 * or any other path the node exposes).
 */
export interface PropertyEntry {
  key: string;
  value: string;
}
