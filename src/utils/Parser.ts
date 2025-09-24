import BrokerRequest, {Principal, Query, RepeatedExecution, SingleExecution} from "../types/BrokerRequest";
import MomentWrapper from "./MomentWrapper";

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
    name: principalEl?.getElementsByTagNameNS(ns, "name")[0]?.textContent?.trim() ?? "",
    organization: principalEl?.getElementsByTagNameNS(ns, "organisation")[0]?.textContent?.trim() ?? "",
    email: principalEl?.getElementsByTagNameNS(ns, "email")[0]?.textContent?.trim() ?? "",
    phone: (() => {
      const txt = principalEl?.getElementsByTagNameNS(ns, "phone")[0]?.textContent?.trim() ?? "";
      return txt === "" ? null : txt;
    })(),
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
    singleExecution = {duration: MomentWrapper.createDuration(durationText)};
  } else if (scheduleType === "repeatedExecution") {
    const reId = scheduleEl?.getElementsByTagNameNS(ns, "id")[0]?.textContent?.trim();
    const intervalText = scheduleEl?.getElementsByTagNameNS(ns, "interval")[0]?.textContent?.trim();
    const intervalHoursText = scheduleEl?.getElementsByTagNameNS(ns, "intervalHours")[0]?.textContent?.trim();
    repeatedExecution = {
      id: reId ? Number(reId) : Number.NaN,
      duration: MomentWrapper.createDuration(durationText ?? ""),
      interval: MomentWrapper.createDuration(intervalText ?? ""),
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
