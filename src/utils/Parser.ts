import BrokerRequest, {Principal, Query, RepeatedExecution, SingleExecution} from "../types/BrokerRequest";
import MomentWrapper from "./MomentWrapper";

const toDate = (v: unknown): Date => (v != null ? new Date(v as any) : new Date(NaN));

const toString = (v: unknown, fallback = ""): string => (v == null ? fallback : String(v));

const toNumber = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (v == null) return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

export function parseRequest(input: unknown): BrokerRequest {
  const r = (input && typeof input === "object") ? (input as Record<string, unknown>) : {};
  const q = (r.query && typeof r.query === "object") ? (r.query as Record<string, unknown>) : {};

  const singleExecution: SingleExecution | undefined = q.singleExecution ? {
    duration: MomentWrapper.createDuration((q.singleExecution as any).duration)
  } : undefined;

  const repeatedExecution: RepeatedExecution | undefined = q.repeatedExecution ? {
    id: toNumber((q.repeatedExecution as any).id),
    duration: MomentWrapper.createDuration((q.repeatedExecution as any).duration),
    interval: MomentWrapper.createDuration((q.repeatedExecution as any).interval),
    intervalHours: toNumber((q.repeatedExecution as any).intervalHours),
  } : undefined;

  const query: Query = {
    title: toString(q.title),
    principal: parsePrincipal(q.principal),
    singleExecution,
    repeatedExecution,
  };

  return {
    id: toNumber(r.id),
    referenceDate: toDate(r.referenceDate),
    scheduledDate: toDate(r.scheduledDate),
    query,
  };
}

export function parsePrincipal(input: unknown): Principal {
  const obj = (input && typeof input === "object") ? (input as Record<string, unknown>) : {};
  return {
    name: toString(obj.name),
    organization: toString(obj.organization),
    email: toString(obj.email),
    phone: toString(obj.phone),
    tags: Array.isArray(obj.tags) ? obj.tags.map(String).filter(Boolean) : [],
  };
}
