/**
 * Assembles the selected catalog blocks into a broker query XML document
 * (namespace http://aktin.org/ns/i2b2/sql): temporary-table declarations,
 * the SQL source as CDATA, anonymize key/ref entries, and one export element
 * per selected table. Parameter values are substituted into the blocks'
 * `{{key}}` placeholders beforehand.
 */
import {
  BlockParam,
  ColumnBlock,
  FilterBlock,
  PrepBlock,
  TableBlock
} from "./CatalogTypes";

/** Parameter values entered for one block, keyed by the param key. */
export type ParamValues = Record<string, string | number | string[] | null>;

export interface BlockSelection<T> {
  block: T;
  values: ParamValues;
}

export interface TableSelection extends BlockSelection<TableBlock> {
  columns: BlockSelection<ColumnBlock>[];
}

/** Everything the user picked in the builder, in catalog order. */
export interface QuerySelection {
  prep: BlockSelection<PrepBlock> | null;
  filters: BlockSelection<FilterBlock>[];
  tables: TableSelection[];
}

/** Initial values for a block's params, derived from their defaults. */
export function createDefaultValues(params: BlockParam[]): ParamValues {
  const values: ParamValues = {};
  for (const param of params) {
    if (param.type === "list") {
      values[param.key] = param.default
        ? param.default.split(",").map((item) => item.trim())
        : [];
    } else if (param.type === "number") {
      values[param.key] = param.default?.trim() ? Number(param.default) : null;
    } else {
      values[param.key] = param.default ?? "";
    }
  }
  return values;
}

function escapeSqlLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

/** Renders a param value for substitution; lists become quoted CSV. */
function renderValue(param: BlockParam, value: ParamValues[string]): string {
  if (param.type === "list") {
    const items = Array.isArray(value) ? value : [];
    return items
      .map((item) => `'${escapeSqlLiteral(String(item))}'`)
      .join(", ");
  }
  return value == null ? "" : String(value);
}

function fillTemplate(sql: string, params: BlockParam[], values: ParamValues) {
  let result = sql;
  for (const param of params) {
    const placeholder = `{{${param.key}}}`;
    result = result
      .split(placeholder)
      .join(renderValue(param, values[param.key]));
  }
  return result;
}

function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Splits any CDATA terminator inside the SQL so the section stays valid. */
function escapeCdata(value: string): string {
  return value.split("]]>").join("]]]]><![CDATA[>");
}

function collectTempTables(selection: QuerySelection): string[] {
  const names = [
    ...(selection.prep?.block.tempTables ?? []),
    ...selection.tables.map((table) => table.block.tableName)
  ];
  return [...new Set(names)];
}

function collectSqlSections(selection: QuerySelection): string[] {
  const sections: string[] = [];
  if (selection.prep) {
    sections.push(
      fillTemplate(
        selection.prep.block.sql,
        selection.prep.block.params,
        selection.prep.values
      )
    );
  }
  for (const filter of selection.filters) {
    sections.push(
      fillTemplate(filter.block.sql, filter.block.params, filter.values)
    );
  }
  for (const table of selection.tables) {
    sections.push(
      fillTemplate(table.block.sql, table.block.params, table.values)
    );
    for (const column of table.columns) {
      sections.push(
        fillTemplate(column.block.sql, column.block.params, column.values)
      );
    }
  }
  return sections;
}

/** Key entries first so the anonymize section is valid regardless of order. */
function collectAnonymizeLines(selection: QuerySelection): string[] {
  const entries = selection.tables
    .filter((table) => table.block.anonymize)
    .map((table) => ({
      table: table.block.tableName,
      column: table.block.anonymize!.column,
      role: table.block.anonymize!.role
    }));
  return [
    ...entries.filter((e) => e.role === "key"),
    ...entries.filter((e) => e.role === "ref")
  ].map(
    (e) =>
      `    <${e.role === "key" ? "key" : "ref"} table="${escapeXmlAttribute(e.table)}" column="${escapeXmlAttribute(e.column)}"/>`
  );
}

/** Builds the complete query XML for the current selection. */
export function assembleQueryXml(selection: QuerySelection): string {
  const lines: string[] = ['<sql xmlns="http://aktin.org/ns/i2b2/sql">'];
  for (const name of collectTempTables(selection)) {
    lines.push(`  <temporary-table name="${escapeXmlAttribute(name)}"/>`);
  }
  lines.push('  <source type="application/sql">');
  lines.push("    <![CDATA[");
  lines.push(escapeCdata(collectSqlSections(selection).join("\n\n")));
  lines.push("]]>");
  lines.push("  </source>");
  const anonymize = collectAnonymizeLines(selection);
  if (anonymize.length) {
    lines.push("  <anonymize>", ...anonymize, "  </anonymize>");
  }
  for (const table of selection.tables) {
    lines.push(
      `  <export table="${escapeXmlAttribute(table.block.tableName)}" destination="${escapeXmlAttribute(table.block.destination)}"/>`
    );
  }
  lines.push("</sql>");
  return lines.join("\n");
}
