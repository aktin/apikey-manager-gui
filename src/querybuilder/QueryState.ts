/**
 * QueryState
 *
 * Serializes the query builder's block selection as the JSON sidecar stored
 * next to a saved query XML, so a saved query can be loaded back into the
 * builder and edited instead of only being viewed. Restoring drops references
 * to blocks that have left the catalog since the query was saved and reports
 * whether anything was dropped.
 */
import { QueryBuilderCatalog } from "./CatalogTypes";
import { ParamValues } from "./QueryXmlAssembler";

/** The block selection as stored in the sidecar of a saved query. */
export interface QuerySelectionState {
  version: 1;
  prepId: string | null;
  filterIds: string[];
  tableIds: string[];
  /** Selected column ids per table id. */
  columnIds: Record<string, string[]>;
  /** Entered parameter values per block id. */
  paramValues: Record<string, ParamValues>;
}

/** A selection without the format version, as held by the builder view. */
export type QuerySelectionInput = Omit<QuerySelectionState, "version">;

/** A restored selection plus whether parts of it had to be skipped. */
export interface RestoredSelection {
  selection: QuerySelectionInput;
  dropped: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function parseIdLists(value: Record<string, unknown>, path: string) {
  const result: Record<string, string[]> = {};
  for (const [key, ids] of Object.entries(value)) {
    if (!isStringArray(ids)) throw new Error(`${path}.${key}: not an id array`);
    result[key] = ids;
  }
  return result;
}

/** Accepts exactly what the param editors produce, so no cast is needed. */
function parseParamValue(value: unknown, path: string): ParamValues[string] {
  if (value === null || typeof value === "string" || typeof value === "number")
    return value;
  if (isStringArray(value)) return value;
  throw new Error(`${path}: unsupported param value`);
}

function parseParamValues(value: Record<string, unknown>, path: string) {
  const result: Record<string, ParamValues> = {};
  for (const [blockId, values] of Object.entries(value)) {
    if (!isRecord(values)) throw new Error(`${path}.${blockId}: not an object`);
    result[blockId] = Object.fromEntries(
      Object.entries(values).map(([key, item]) => [
        key,
        parseParamValue(item, `${path}.${blockId}.${key}`)
      ])
    );
  }
  return result;
}

/** Every block id the selection refers to, for pruning parameter values. */
function collectSelectedIds(selection: QuerySelectionInput): Set<string> {
  const ids = new Set<string>();
  if (selection.prepId) ids.add(selection.prepId);
  for (const id of selection.filterIds) ids.add(id);
  for (const tableId of selection.tableIds) {
    ids.add(tableId);
    for (const columnId of selection.columnIds[tableId] ?? [])
      ids.add(columnId);
  }
  return ids;
}

/**
 * Serializes a selection for the sidecar file. Parameter values of blocks that
 * are not selected are left out, so the file describes exactly the saved query.
 */
export function serializeQueryState(selection: QuerySelectionInput): string {
  const selectedIds = collectSelectedIds(selection);
  const paramValues: Record<string, ParamValues> = {};
  for (const [blockId, values] of Object.entries(selection.paramValues)) {
    if (selectedIds.has(blockId)) paramValues[blockId] = values;
  }
  const state: QuerySelectionState = {
    version: 1,
    prepId: selection.prepId,
    filterIds: selection.filterIds,
    tableIds: selection.tableIds,
    columnIds: Object.fromEntries(
      selection.tableIds.map((tableId) => [
        tableId,
        selection.columnIds[tableId] ?? []
      ])
    ),
    paramValues
  };
  return JSON.stringify(state, null, 2);
}

/** Parses and validates a sidecar file; throws on any problem. */
export function parseQueryState(json: string): QuerySelectionState {
  const value: unknown = JSON.parse(json);
  if (!isRecord(value)) throw new Error("query state: not an object");
  if (value.version !== 1)
    throw new Error(
      `query state: unsupported version "${String(value.version)}"`
    );
  if (value.prepId !== null && typeof value.prepId !== "string")
    throw new Error("query state: invalid prepId");
  if (!isStringArray(value.filterIds))
    throw new Error("query state: missing filterIds array");
  if (!isStringArray(value.tableIds))
    throw new Error("query state: missing tableIds array");
  if (!isRecord(value.columnIds))
    throw new Error("query state: missing columnIds object");
  if (!isRecord(value.paramValues))
    throw new Error("query state: missing paramValues object");
  return {
    version: 1,
    prepId: value.prepId,
    filterIds: value.filterIds,
    tableIds: value.tableIds,
    columnIds: parseIdLists(value.columnIds, "columnIds"),
    paramValues: parseParamValues(value.paramValues, "paramValues")
  };
}

/**
 * Maps a stored selection onto the given catalog, keeping only blocks that
 * still exist. `dropped` tells the caller that the restored query is no longer
 * the one that was saved.
 */
export function restoreSelection(
  state: QuerySelectionState,
  catalog: QueryBuilderCatalog
): RestoredSelection {
  let dropped = false;
  const prepId = catalog.preps.some((prep) => prep.id === state.prepId)
    ? state.prepId
    : null;
  if (state.prepId && !prepId) dropped = true;

  const filterIds = state.filterIds.filter((id) =>
    catalog.filters.some((filter) => filter.id === id)
  );
  if (filterIds.length !== state.filterIds.length) dropped = true;

  const tableIds = state.tableIds.filter((id) =>
    catalog.tables.some((table) => table.id === id)
  );
  if (tableIds.length !== state.tableIds.length) dropped = true;

  const columnIds: Record<string, string[]> = {};
  for (const tableId of tableIds) {
    const table = catalog.tables.find((item) => item.id === tableId)!;
    const stored = state.columnIds[tableId] ?? [];
    const kept = stored.filter((id) =>
      table.columns.some((column) => column.id === id)
    );
    if (kept.length !== stored.length) dropped = true;
    columnIds[tableId] = kept;
  }

  return {
    selection: {
      prepId,
      filterIds,
      tableIds,
      columnIds,
      paramValues: state.paramValues
    },
    dropped
  };
}
