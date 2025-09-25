import {MomentDuration} from "../utils/MomentWrapper";

export default interface BrokerRequest {
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
