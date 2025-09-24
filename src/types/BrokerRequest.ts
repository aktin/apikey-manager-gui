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
  [key: string]: string | string[] | null;

  name: string;
  organization: string;
  email: string;
  phone: string | null;
  tags: string[];
}

export interface SingleExecution {
  duration: MomentDuration;
}

export interface RepeatedExecution {
  id: number;
  duration: MomentDuration;
  interval: MomentDuration;
  intervalHours: number;
}
