/**
 * CatalogStorage
 *
 * Static utility class for persisting the query-builder catalog as a JSON
 * file in the app's userData folder (via the Electron `queryBuilderFiles`
 * bridge), and for converting it from/to the same JSON format used for
 * import and export. Import validates the structure and reports the first
 * problem found in a plain error message.
 */
import {
  BlockParam,
  createEmptyCatalog,
  FilterBlock,
  ParamType,
  PrepBlock,
  QueryBuilderCatalog,
  TableAnonymize,
  TableBlock
} from "./CatalogTypes";

const PARAM_TYPES: ParamType[] = ["date", "number", "text", "list", "choice"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function parseParam(value: unknown, path: string): BlockParam {
  if (!isRecord(value)) throw new Error(`${path}: not an object`);
  if (typeof value.key !== "string" || !value.key.trim())
    throw new Error(`${path}: missing param key`);
  if (typeof value.label !== "string")
    throw new Error(`${path}: missing param label`);
  const type = PARAM_TYPES.find((item) => item === value.type);
  if (!type)
    throw new Error(`${path}: unknown param type "${String(value.type)}"`);
  if (value.default !== undefined && typeof value.default !== "string")
    throw new Error(`${path}: default must be a string`);
  if (value.options !== undefined && !isStringArray(value.options))
    throw new Error(`${path}: options must be a string array`);
  return {
    key: value.key,
    label: value.label,
    type,
    ...(value.default !== undefined ? { default: value.default } : {}),
    ...(value.options !== undefined ? { options: value.options } : {})
  };
}

/** Validates the fields shared by all block kinds and returns them typed. */
function parseBaseBlock(value: unknown, path: string): FilterBlock {
  if (!isRecord(value)) throw new Error(`${path}: not an object`);
  if (typeof value.id !== "string" || !value.id.trim())
    throw new Error(`${path}: missing id`);
  if (typeof value.label !== "string" || !value.label.trim())
    throw new Error(`${path}: missing label`);
  if (value.description !== undefined && typeof value.description !== "string")
    throw new Error(`${path}: description must be a string`);
  if (typeof value.sql !== "string") throw new Error(`${path}: missing sql`);
  if (!Array.isArray(value.params))
    throw new Error(`${path}: missing params array`);
  return {
    id: value.id,
    label: value.label,
    ...(value.description !== undefined
      ? { description: value.description }
      : {}),
    sql: value.sql,
    params: value.params.map((param, i) =>
      parseParam(param, `${path}.params[${i}]`)
    )
  };
}

function parsePrep(value: unknown, path: string): PrepBlock {
  if (!isRecord(value)) throw new Error(`${path}: not an object`);
  const base = parseBaseBlock(value, path);
  if (!isStringArray(value.tempTables))
    throw new Error(`${path}: missing tempTables array`);
  return { ...base, tempTables: value.tempTables };
}

function parseAnonymize(value: unknown, path: string): TableAnonymize {
  if (
    !isRecord(value) ||
    typeof value.column !== "string" ||
    (value.role !== "key" && value.role !== "ref")
  )
    throw new Error(`${path}: invalid anonymize entry`);
  return { column: value.column, role: value.role };
}

function parseTable(value: unknown, path: string): TableBlock {
  if (!isRecord(value)) throw new Error(`${path}: not an object`);
  const base = parseBaseBlock(value, path);
  if (typeof value.tableName !== "string" || !value.tableName.trim())
    throw new Error(`${path}: missing tableName`);
  if (typeof value.destination !== "string" || !value.destination.trim())
    throw new Error(`${path}: missing destination`);
  if (!Array.isArray(value.columns))
    throw new Error(`${path}: missing columns array`);
  return {
    ...base,
    tableName: value.tableName,
    destination: value.destination,
    ...(value.anonymize !== undefined
      ? { anonymize: parseAnonymize(value.anonymize, path) }
      : {}),
    columns: value.columns.map((column, i) =>
      parseBaseBlock(column, `${path}.columns[${i}]`)
    )
  };
}

export default class CatalogStorage {
  /**
   * Parses and validates a catalog JSON string; throws on any problem.
   * The catalog is rebuilt field by field from the validated input, so the
   * result is typed without casts.
   */
  static parse(json: string): QueryBuilderCatalog {
    const value: unknown = JSON.parse(json);
    if (!isRecord(value)) throw new Error("catalog: not an object");
    if (value.version !== 1)
      throw new Error(
        `catalog: unsupported version "${String(value.version)}"`
      );
    if (!Array.isArray(value.preps))
      throw new Error("catalog: missing preps array");
    if (!Array.isArray(value.filters))
      throw new Error("catalog: missing filters array");
    if (!Array.isArray(value.tables))
      throw new Error("catalog: missing tables array");
    return {
      version: 1,
      preps: value.preps.map((prep, i) => parsePrep(prep, `preps[${i}]`)),
      filters: value.filters.map((filter, i) =>
        parseBaseBlock(filter, `filters[${i}]`)
      ),
      tables: value.tables.map((table, i) => parseTable(table, `tables[${i}]`))
    };
  }

  /** Serializes a catalog for file export. */
  static serialize(catalog: QueryBuilderCatalog): string {
    return JSON.stringify(catalog, null, 2);
  }

  /** Loads the stored catalog; a missing, invalid, or empty file is null. */
  static async load(): Promise<QueryBuilderCatalog | null> {
    const raw = await window.queryBuilderFiles.readCatalog();
    if (!raw) return null;
    try {
      const catalog = this.parse(raw);
      const empty =
        !catalog.preps.length &&
        !catalog.filters.length &&
        !catalog.tables.length;
      return empty ? null : catalog;
    } catch {
      // Deliberately without the error object: parse errors can quote file
      // content, which must not end up in logs.
      console.error("Failed to load stored catalog");
      return null;
    }
  }

  static async save(catalog: QueryBuilderCatalog): Promise<void> {
    await window.queryBuilderFiles.writeCatalog(this.serialize(catalog));
  }

  /** Resets the catalog file to an empty catalog. */
  static async clear(): Promise<void> {
    await this.save(createEmptyCatalog());
  }
}
