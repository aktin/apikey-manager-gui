/**
 * Parsers that convert AKTIN Broker XML responses into typed domain objects.
 */
import {
  BrokerRequest,
  NodeStatusInfo,
  Principal,
  Query,
  RepeatedExecution,
  RequestInfo,
  RequestListEntry,
  SingleExecution
} from "../types/BrokerRequest";
import { createDuration } from "./MomentWrapper";

/**
 * Parses a broker request document (AKTIN exchange namespace) into a
 * {@link BrokerRequest}, resolving its single- or repeated-execution schedule.
 */
export function parseXmlBrokerRequest(xml: string): BrokerRequest {
  const ns = "http://aktin.org/ns/exchange";
  const xsi = "http://www.w3.org/2001/XMLSchema-instance";

  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const get1 = (tag: string) =>
    doc.getElementsByTagNameNS(ns, tag)[0]?.textContent?.trim() ?? "";

  const idText = get1("id");
  const referenceText = get1("reference");
  const scheduledText = get1("scheduled");

  const principalEl = doc.getElementsByTagNameNS(ns, "principal")[0];
  const principal: Principal = {
    tags: (() => {
      const tagEls = principalEl?.getElementsByTagNameNS(ns, "tag");
      return tagEls
        ? Array.from(tagEls)
            .map((el) => el.textContent?.trim() ?? "")
            .filter(Boolean)
        : [];
    })()
  };
  const scheduleEl = doc.getElementsByTagNameNS(ns, "schedule")[0];
  const scheduleType = scheduleEl?.getAttributeNS(xsi, "type") ?? "";
  const durationText = scheduleEl
    ?.getElementsByTagNameNS(ns, "duration")[0]
    ?.textContent?.trim();

  let singleExecution: SingleExecution | undefined;
  let repeatedExecution: RepeatedExecution | undefined;

  if (scheduleType === "singleExecution" && durationText) {
    singleExecution = { duration: createDuration(durationText) };
  } else if (scheduleType === "repeatedExecution") {
    const reId = scheduleEl
      ?.getElementsByTagNameNS(ns, "id")[0]
      ?.textContent?.trim();
    const intervalText = scheduleEl
      ?.getElementsByTagNameNS(ns, "interval")[0]
      ?.textContent?.trim();
    const intervalHoursText = scheduleEl
      ?.getElementsByTagNameNS(ns, "intervalHours")[0]
      ?.textContent?.trim();
    repeatedExecution = {
      id: reId ? Number(reId) : Number.NaN,
      duration: createDuration(durationText ?? ""),
      interval: createDuration(intervalText ?? ""),
      intervalHours: intervalHoursText ? Number(intervalHoursText) : null
    };
  }

  const query: Query = {
    title: get1("title"),
    principal,
    singleExecution,
    repeatedExecution
  };

  return {
    id: Number(idText),
    referenceDate: new Date(referenceText),
    scheduledDate: new Date(scheduledText),
    query
  };
}

/**
 * Parses a broker request list (AKTIN exchange namespace) into entries holding
 * each request's id and publish date.
 */
export function parseXmlBrokerRequestList(xml: string): RequestListEntry[] {
  const ns = "http://aktin.org/ns/exchange";
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return Array.from(doc.getElementsByTagNameNS(ns, "request")).map((el) => ({
    id: Number(el.getAttribute("id")),
    publishDate: new Date(
      el.getElementsByTagNameNS(ns, "published")[0]?.textContent?.trim() ?? ""
    )
  }));
}

export function parseXmlBrokerRequestInfo(xml: string): RequestInfo {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const published = doc.getElementsByTagName("published")[0]?.textContent || "";
  const targeted =
    doc.getElementsByTagName("targeted")[0]?.textContent || "false";
  return {
    publishDate: new Date(published),
    targeted: targeted.toLowerCase() === "true"
  };
}

export function parseXmlBrokerRequestStatus(xml: string): NodeStatusInfo[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const infos = Array.from(doc.getElementsByTagName("request-status-info"));
  return infos.map((el) => ({
    nodeId: Number(el.getElementsByTagName("node")[0]?.textContent || 0),
    retrieved: optDate(el, "retrieved"),
    queued: optDate(el, "queued"),
    processing: optDate(el, "processing"),
    completed: optDate(el, "completed"),
    rejected: optDate(el, "rejected"),
    failed: optDate(el, "failed"),
    deleted: optDate(el, "deleted"),
    expired: optDate(el, "expired")
  }));
}

function optDate(parent: Element, tag: string): Date | null {
  const text = parent.getElementsByTagName(tag)[0]?.textContent;
  return text ? new Date(text) : null;
}

/**
 * Parses a broker node list (AKTIN exchange namespace) into a mapping of each
 * node's client DN to its node ID.
 */
export function parseNodeIdMap(xml: string): Map<string, string> {
  const ns = "http://aktin.org/ns/exchange";
  const map = new Map<string, string>();
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const nodes = doc.getElementsByTagNameNS(ns, "node");
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const id = node.getElementsByTagNameNS(ns, "id")[0]?.textContent?.trim();
    const dn = node
      .getElementsByTagNameNS(ns, "clientDN")[0]
      ?.textContent?.trim();
    if (id && dn) {
      map.set(dn, id);
    }
  }
  return map;
}

/**
 * Merges the broker's plaintext API-key list with node IDs into table rows,
 * splitting each DN into its components (CN, O, L) and flagging inactive keys.
 */
export function mergeApiKeysWithNodes(
  keyData: string,
  nodeMap: Map<string, string>
): Record<string, any>[] {
  return keyData
    .trim()
    .split("\n")
    .filter((line) => line.includes("="))
    .filter((line) => !line.includes("OU"))
    .map((line) => {
      const idx = line.indexOf("=");
      const apiKey = line.slice(0, idx);
      const dn = line.slice(idx + 1);
      const row: Record<string, any> = {
        raw: line,
        apiKey,
        dn,
        nodeId: nodeMap.get(dn) ?? null,
        isActive: true
      };
      for (const part of dn.split(",")) {
        if (part.includes("=")) {
          const [key, value] = part.split("=");
          row[key] = value;
        } else if (part === "INACTIVE") {
          row.isActive = false;
        }
      }
      return row;
    });
}
