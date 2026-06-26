/**
 * Shared helpers for a broker node's processing state: the lifecycle order, the
 * most advanced state a node has reached, and a state's display icon/colour.
 * Used by the node-status timeline and the request status summary so both agree
 * on what a node's "state" is and how it looks.
 */
import { NodeStatusInfo } from "../types/BrokerRequest";

/** Node lifecycle stages, ordered from earliest to latest. */
export const NODE_STATE_ORDER = [
  "retrieved",
  "queued",
  "processing",
  "rejected",
  "failed",
  "expired",
  "completed"
] as const;

export type NodeState = (typeof NODE_STATE_ORDER)[number];

/** Returns the most advanced lifecycle stage a node has reached, or null. */
export function getMostActualState(node: NodeStatusInfo): NodeState | null {
  let latest: NodeState | null = null;
  for (const state of NODE_STATE_ORDER) {
    if (node[state]) latest = state;
  }
  return latest;
}

/** PrimeIcons class for a node state. */
export function nodeStateIcon(state: NodeState | null): string {
  switch (state) {
    case "retrieved":
      return "pi pi-cloud-download";
    case "queued":
      return "pi pi-clock";
    case "processing":
      return "pi pi-spin pi-cog";
    case "rejected":
      return "pi pi-times-circle";
    case "completed":
      return "pi pi-check-circle";
    case "failed":
      return "pi pi-exclamation-triangle";
    case "expired":
      return "pi pi-hourglass";
    default:
      return "pi pi-question-circle";
  }
}

/** Text-colour class for a node state. */
export function nodeStateColorClass(state: NodeState | null): string {
  switch (state) {
    case "rejected":
      return "text-blue-500";
    case "completed":
      return "text-green-500";
    case "failed":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}
