import { MomentDuration } from "../utils/MomentWrapper";

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
  principal: Principal;
  singleExecution?: SingleExecution;
  repeatedExecution?: RepeatedExecution;
}

export interface Principal {
  tags: string[];
}

export interface SingleExecution {
  duration: MomentDuration;
}

export interface RepeatedExecution {
  id: number;
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
