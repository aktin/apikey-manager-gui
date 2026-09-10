/**
 * Type definitions for the query-builder catalog.
 *
 * A catalog is a user-provided collection of SQL building blocks; the app
 * ships without any catalog content. Blocks carry SQL templates with
 * `{{key}}` placeholders and declare their parameters, which the UI renders
 * as form fields. DWH-side placeholders such as `${data.start}` and
 * `${data.end}` are not touched by the app and are substituted by the DWH at
 * execution time from the request's reference date and duration, which is what
 * makes a block usable in series requests. The assembled blocks form a broker
 * query in the `http://aktin.org/ns/i2b2/sql` XML format.
 */

/** Input types a block parameter can declare; decides the rendered field. */
export type ParamType = "date" | "number" | "text" | "list" | "choice";

/** A single parameter declared by a block's SQL template. */
export interface BlockParam {
  /** Placeholder key referenced in the SQL template. */
  key: string;
  label: string;
  type: ParamType;
  /** Optional preset; lists use a comma-separated string. */
  default?: string;
  /** Selectable values, only used by "choice" parameters. */
  options?: string[];
}

interface BaseBlock {
  id: string;
  label: string;
  description?: string;
  /** SQL template with `{{key}}` placeholders for the declared params. */
  sql: string;
  params: BlockParam[];
}

/** Opening block of a query; creates the temporary tables it declares. */
export interface PrepBlock extends BaseBlock {
  /** Names of the temporary tables the SQL creates. */
  tempTables: string[];
}

/** Optional block applied after preparation, e.g. cohort restrictions. */
export type FilterBlock = BaseBlock;

/** Column block appended to its parent table's base SQL. */
export type ColumnBlock = BaseBlock;

/** Role of a table in the result anonymization. */
export interface TableAnonymize {
  column: string;
  role: "key" | "ref";
}

/** An exportable result table with its base SQL and optional columns. */
export interface TableBlock extends BaseBlock {
  /** Name of the temporary table the base SQL creates. */
  tableName: string;
  /** Destination name used in the query's export element. */
  destination: string;
  anonymize?: TableAnonymize;
  columns: ColumnBlock[];
}

/** Root structure persisted in the store and exchanged as JSON file. */
export interface QueryBuilderCatalog {
  version: 1;
  preps: PrepBlock[];
  filters: FilterBlock[];
  tables: TableBlock[];
}

/** Returns a new catalog without any blocks. */
export function createEmptyCatalog(): QueryBuilderCatalog {
  return { version: 1, preps: [], filters: [], tables: [] };
}
