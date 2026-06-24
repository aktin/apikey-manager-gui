import BrokerRequest, {NodeStatusInfo, Principal, Query, RepeatedExecution, RequestInfo, SingleExecution} from "../types/BrokerRequest";
import {createDuration} from "./MomentWrapper";

export function parseXmlBrokerRequest(xml: string): BrokerRequest {
  const ns = "http://aktin.org/ns/exchange";
  const xsi = "http://www.w3.org/2001/XMLSchema-instance";

  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const get1 = (tag: string) => doc.getElementsByTagNameNS(ns, tag)[0]?.textContent?.trim() ?? "";

  const idText = get1("id");
  const referenceText = get1("reference");
  const scheduledText = get1("scheduled");

  const principalEl = doc.getElementsByTagNameNS(ns, "principal")[0];
  const principal: Principal = {
    tags: (() => {
      const tagEls = principalEl?.getElementsByTagNameNS(ns, "tag");
      return tagEls ? Array.from(tagEls).map(el => el.textContent?.trim() ?? "").filter(Boolean) : [];
    })(),
  };
  const scheduleEl = doc.getElementsByTagNameNS(ns, "schedule")[0];
  const scheduleType = scheduleEl?.getAttributeNS(xsi, "type") ?? "";
  const durationText = scheduleEl?.getElementsByTagNameNS(ns, "duration")[0]?.textContent?.trim();

  let singleExecution: SingleExecution | undefined;
  let repeatedExecution: RepeatedExecution | undefined;

  if (scheduleType === "singleExecution" && durationText) {
    singleExecution = {duration: createDuration(durationText)};
  } else if (scheduleType === "repeatedExecution") {
    const reId = scheduleEl?.getElementsByTagNameNS(ns, "id")[0]?.textContent?.trim();
    const intervalText = scheduleEl?.getElementsByTagNameNS(ns, "interval")[0]?.textContent?.trim();
    const intervalHoursText = scheduleEl?.getElementsByTagNameNS(ns, "intervalHours")[0]?.textContent?.trim();
    repeatedExecution = {
      id: reId ? Number(reId) : Number.NaN,
      duration: createDuration(durationText ?? ""),
      interval: createDuration(intervalText ?? ""),
      intervalHours: intervalHoursText ? Number(intervalHoursText) : Number.NaN,
    };
  }

  const query: Query = {
    title: get1("title"),
    principal,
    singleExecution,
    repeatedExecution,
  };

  return {
    id: Number(idText),
    referenceDate: new Date(referenceText),
    scheduledDate: new Date(scheduledText),
    query,
  };
}

export function parseXmlBrokerRequestInfo(xml: string): RequestInfo {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const published = doc.getElementsByTagName("published")[0]?.textContent || "";
  const targeted = doc.getElementsByTagName("targeted")[0]?.textContent || "false";
  return {
    publishDate: new Date(published),
    targeted: targeted.toLowerCase() === "true",
  };
}

export function parseXmlBrokerRequestStatus(xml: string): NodeStatusInfo[] {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const infos = Array.from(doc.getElementsByTagName("request-status-info"));
  return infos.map(el => ({
    nodeId: Number(el.getElementsByTagName("node")[0]?.textContent || 0),
    retrieved: optDate(el, "retrieved"),
    queued: optDate(el, "queued"),
    processing: optDate(el, "processing"),
    completed: optDate(el, "completed"),
    rejected: optDate(el, "rejected"),
    failed: optDate(el, "failed"),
    deleted: optDate(el, "deleted"),
    expired: optDate(el, "expired"),
  }));
}

function optDate(parent: Element, tag: string): Date | null {
  const text = parent.getElementsByTagName(tag)[0]?.textContent;
  return text ? new Date(text) : null;
}