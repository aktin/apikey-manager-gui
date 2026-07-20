/**
 * Builders for the AKTIN exchange XML payloads that create a broker query
 * request: the `<queryRequest>` definition and the optional `<nodes>` target
 * restriction. String assembly mirrors the broker-admin form; text content is
 * XML-escaped, while the query fragment is embedded verbatim.
 */
import { CreateQueryPayload } from "../types/BrokerRequest";

const NS = "http://aktin.org/ns/exchange";
const XSI = "http://www.w3.org/2001/XMLSchema-instance";

/** Escapes XML-special characters so text values are safe as element content. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Builds the `<schedule>` element for a single- or repeated-execution request. */
function buildSchedule(payload: CreateQueryPayload): string {
  const duration = `<duration>${payload.duration}</duration>`;
  if (!payload.repeated) {
    return `<schedule xsi:type="singleExecution">${duration}</schedule>`;
  }
  const { interval, intervalHours, seriesId } = payload.repeated;
  const hours =
    intervalHours != null
      ? `<intervalHours>${intervalHours}</intervalHours>`
      : "";
  const id = seriesId != null ? `<id>${seriesId}</id>` : "";
  return `<schedule xsi:type="repeatedExecution">${duration}<interval>${interval}</interval>${hours}${id}</schedule>`;
}

/**
 * Builds the `<queryRequest>` definition XML for the allocated request id. The
 * id must match the request URL. The query fragment (e.g. an `<sql>` element)
 * is inserted after the schedule, verbatim.
 */
export function buildQueryRequestXml(
  id: number,
  payload: CreateQueryPayload
): string {
  const p = payload.principal;
  const tags = p.tags.map((tag) => `<tag>${escapeXml(tag)}</tag>`).join("");
  return (
    `<queryRequest xmlns="${NS}" xmlns:xsi="${XSI}">` +
    `<id>${id}</id>` +
    `<reference>${payload.reference.toISOString()}</reference>` +
    `<scheduled>${payload.scheduled.toISOString()}</scheduled>` +
    `<query>` +
    `<title>${escapeXml(payload.title)}</title>` +
    `<description>${escapeXml(payload.description)}</description>` +
    `<principal>` +
    `<name>${escapeXml(p.name ?? "")}</name>` +
    `<organisation>${escapeXml(p.organisation ?? "")}</organisation>` +
    `<email>${escapeXml(p.email ?? "")}</email>` +
    `<phone>${escapeXml(p.phone ?? "")}</phone>` +
    `<tags>${tags}</tags>` +
    `</principal>` +
    buildSchedule(payload) +
    payload.queryXml +
    `</query>` +
    `</queryRequest>`
  );
}

/** Builds the `<nodes>` XML restricting a request to the given node ids. */
export function buildNodesXml(nodeIds: number[]): string {
  const nodes = nodeIds.map((id) => `<node>${id}</node>`).join("");
  return `<nodes xmlns="${NS}">${nodes}</nodes>`;
}
