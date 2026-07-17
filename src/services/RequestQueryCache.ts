import { parseXmlBrokerRequest } from "../utils/Parser";
import { RequestQuerySummary } from "../types/BrokerRequest";

/** The query-definition slice of a list row: series id and principal tags. */
type QueryFields = Pick<RequestQuerySummary, "seriesId" | "tags">;

/**
 * Caches the query-definition fields of each request (series id, principal
 * tags), parsed from its definition XML and keyed by request id, so the
 * request list does not refetch every definition on each visit.
 */
export class RequestQueryCache {
  private readonly idToFields = new Map<number, QueryFields>();

  /** Parses a request definition XML and stores its query fields under `id`. */
  updateFromXml(id: number, xml: string): void {
    const { query } = parseXmlBrokerRequest(xml);
    this.idToFields.set(id, {
      seriesId: query.repeatedExecution?.id ?? null,
      tags: query.principal.tags
    });
  }

  get(id: number): QueryFields | null {
    return this.idToFields.get(id) ?? null;
  }

  clear(): void {
    this.idToFields.clear();
  }
}
