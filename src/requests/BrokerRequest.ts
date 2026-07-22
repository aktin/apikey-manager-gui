import { MomentDuration } from "../shared/MomentWrapper";

/**
 * A scheduled query the broker runs against its nodes.
 *
 * Root of the broker-request domain model; composes the {@link Query} that
 * defines what is asked. Parsed from broker XML by `Parser.parseXmlBrokerRequest`.
 */
export interface BrokerRequest {
  id: number;
  referenceDate: Date;
  scheduledDate: Date;
  query: Query;
}

export interface Query {
  title: string;
  description: string;
  /** The request's query extension element as serialized XML. */
  queryXml: string;
  principal: Principal;
  singleExecution?: SingleExecution;
  repeatedExecution?: RepeatedExecution;
}

export interface Principal {
  name: string | null;
  organisation: string | null;
  email: string | null;
  phone: string | null;
  tags: string[];
}

export interface SingleExecution {
  duration: MomentDuration;
}

export interface RepeatedExecution {
  id: number | null;
  duration: MomentDuration;
  interval: MomentDuration;
  intervalHours: number | null;
}

export interface RequestInfo {
  publishDate: Date;
  targeted: boolean;
}

/** One entry of the broker request list (`GET /broker/request`). */
export interface RequestListEntry {
  id: number;
  publishDate: Date;
}

/**
 * Row model of the broker request list: the list-entry fields plus the series
 * id and principal tags parsed from the request's definition XML (the list
 * endpoint does not return them).
 */
export interface RequestQuerySummary extends RequestListEntry {
  seriesId: number | null;
  tags: string[];
}

/**
 * Form payload for creating a broker query request. Distinct from the parsed
 * read model: durations are ISO-8601 strings (raw form values, not Moment
 * durations) and `targetNodeIds` restricts the request to those nodes
 * (`null` publishes to all nodes).
 */
export interface CreateQueryPayload {
  reference: Date;
  scheduled: Date;
  title: string;
  description: string;
  queryXml: string;
  principal: Principal;
  duration: string;
  repeated: RepeatedSchedule | null;
  targetNodeIds: number[] | null;
}

/** Repeated-execution parameters of a {@link CreateQueryPayload}. */
export interface RepeatedSchedule {
  interval: string;
  intervalHours: number | null;
  seriesId: number | null;
}

/**
 * Per-node processing status of a {@link BrokerRequest}.
 *
 * Each field holds the timestamp a lifecycle stage was reached for one node,
 * or `null` if not yet reached. Fetched via `Parser.parseXmlBrokerRequestStatus`
 * and rendered by the `NodeStatusInfoTimeline` component.
 */
export interface NodeStatusInfo {
  nodeId: number;
  retrieved: Date | null;
  queued: Date | null;
  processing: Date | null;
  completed: Date | null;
  rejected: Date | null;
  failed: Date | null;
  deleted: Date | null;
  expired: Date | null;
}
