<script setup lang="ts">
/**
 * QueryBuilderView.vue
 *
 * Route view for composing a broker query from catalog blocks: catalog
 * management (import/export/clear, custom blocks) and block selection on the
 * left, a live XML preview with copy/download on the right. The catalog is
 * persisted via CatalogStorage; the selection is view-local state.
 *
 * Saved queries are stored with their block selection, so loading one puts the
 * builder back into the state that produced it. Loading and saving are separate
 * controls on purpose: saving can only overwrite the query that is currently
 * loaded, so an unrelated selection can never replace a saved query.
 */
import { computed, onMounted, ref, watch } from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Checkbox from "primevue/checkbox";
import ConfirmPopup from "primevue/confirmpopup";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import {
  createErrorToast,
  createInfoToast,
  createSuccessToast
} from "../shared/ToastWrapper";
import {
  ColumnBlock,
  createEmptyCatalog,
  FilterBlock,
  PrepBlock,
  QueryBuilderCatalog,
  TableBlock
} from "./CatalogTypes";
import CatalogStorage from "./CatalogStorage";
import {
  assembleQueryXml,
  createDefaultValues,
  ParamValues,
  QuerySelection
} from "./QueryXmlAssembler";
import { downloadTextFile } from "./FileTransfer";
import { isValidQueryName } from "./QueryName";
import {
  parseQueryState,
  QuerySelectionState,
  restoreSelection,
  serializeQueryState
} from "./QueryState";
import CatalogManager from "./CatalogManager.vue";
import CustomBlockEditor, {
  DeletedBlockPayload,
  SavedBlockPayload
} from "./CustomBlockEditor.vue";
import BlockParamFields from "./BlockParamFields.vue";
import TableBlockPanel from "./TableBlockPanel.vue";

const { t } = useI18n();
const toast = useToast();
const confirm = useConfirm();

const catalog = ref<QueryBuilderCatalog | null>(null);
const blockEditor = ref<InstanceType<typeof CustomBlockEditor> | null>(null);

const savedQueryNames = ref<string[]>([]);
// The saved query the builder currently holds: the load dropdown displays it
// and the delete button acts on it.
const loadedQueryName = ref<string | null>(null);
// Whether the loaded query came with a block selection. Only such a query may
// be overwritten, so an unrelated selection can never replace a saved one.
const loadedIsResumable = ref(false);
// The loaded or last saved selection, serialized, as the baseline for detecting
// unsaved changes.
const savedStateJson = ref<string | null>(null);
// Name typed into the save field, independent of what is loaded.
const saveName = ref("");
// Content of a saved query without stored block selection: it cannot be
// restored into the builder, so it is shown as read-only text instead.
const readOnlyXml = ref<string | null>(null);
// Anchor element for the confirm popups of the load dropdown.
const loadControl = ref<HTMLElement | null>(null);

const selectedPrepId = ref<string | null>(null);
const selectedFilterIds = ref<string[]>([]);
const selectedTableIds = ref<string[]>([]);
// Selected column ids per table id.
const selectedColumns = ref<Record<string, string[]>>({});
// Entered parameter values per block id.
const paramValues = ref<Record<string, ParamValues>>({});

const prepOptions = computed(() =>
  (catalog.value?.preps ?? []).map((prep) => ({
    label: prep.label,
    value: prep.id
  }))
);

const selectedPrep = computed<PrepBlock | null>(
  () =>
    catalog.value?.preps.find((prep) => prep.id === selectedPrepId.value) ??
    null
);

const selection = computed<QuerySelection>(() => {
  const cat = catalog.value;
  const prep = selectedPrep.value;
  return {
    prep: prep
      ? { block: prep, values: paramValues.value[prep.id] ?? {} }
      : null,
    filters: (cat?.filters ?? [])
      .filter((filter) => selectedFilterIds.value.includes(filter.id))
      .map((filter) => ({
        block: filter,
        values: paramValues.value[filter.id] ?? {}
      })),
    tables: (cat?.tables ?? [])
      .filter((table) => selectedTableIds.value.includes(table.id))
      .map((table) => ({
        block: table,
        values: paramValues.value[table.id] ?? {},
        columns: table.columns
          .filter((column) =>
            (selectedColumns.value[table.id] ?? []).includes(column.id)
          )
          .map((column) => ({
            block: column,
            values: paramValues.value[column.id] ?? {}
          }))
      }))
  };
});

const queryXml = computed(() =>
  selection.value.prep ? assembleQueryXml(selection.value) : ""
);

/** What the preview pane and its copy/download actions operate on. */
const previewXml = computed(() => readOnlyXml.value ?? queryXml.value);

/** The current selection in the format stored next to a saved query. */
const currentStateJson = computed(() =>
  serializeQueryState({
    prepId: selectedPrepId.value,
    filterIds: selectedFilterIds.value,
    tableIds: selectedTableIds.value,
    columnIds: selectedColumns.value,
    paramValues: paramValues.value
  })
);

/** Whether the selection differs from the loaded or last saved query. */
const hasUnsavedChanges = computed(
  () => !!queryXml.value && currentStateJson.value !== savedStateJson.value
);

// Touching the selection returns the preview to the live assembly.
watch(selection, () => {
  readOnlyXml.value = null;
});

function ensureDefaults(blockId: string, params: PrepBlock["params"]): void {
  if (!paramValues.value[blockId])
    paramValues.value[blockId] = createDefaultValues(params);
}

function setParamValue(
  blockId: string,
  key: string,
  value: ParamValues[string]
): void {
  if (!paramValues.value[blockId]) paramValues.value[blockId] = {};
  paramValues.value[blockId][key] = value;
}

function onPrepSelected(prepId: string | null): void {
  const prep = catalog.value?.preps.find((p) => p.id === prepId);
  if (prep) ensureDefaults(prep.id, prep.params);
}

function onPrepParamChange(key: string, value: ParamValues[string]): void {
  if (selectedPrep.value) setParamValue(selectedPrep.value.id, key, value);
}

function toggleFilter(filter: FilterBlock): void {
  const index = selectedFilterIds.value.indexOf(filter.id);
  if (index >= 0) {
    selectedFilterIds.value.splice(index, 1);
    return;
  }
  selectedFilterIds.value.push(filter.id);
  ensureDefaults(filter.id, filter.params);
}

function toggleTable(tableId: string): void {
  const index = selectedTableIds.value.indexOf(tableId);
  if (index >= 0) {
    selectedTableIds.value.splice(index, 1);
    return;
  }
  const table = catalog.value?.tables.find((t) => t.id === tableId);
  if (!table) return;
  selectedTableIds.value.push(tableId);
  ensureDefaults(table.id, table.params);
}

function toggleColumn(tableId: string, columnId: string): void {
  const columns = selectedColumns.value[tableId] ?? [];
  const index = columns.indexOf(columnId);
  if (index >= 0) {
    columns.splice(index, 1);
  } else {
    const column = catalog.value?.tables
      .find((t) => t.id === tableId)
      ?.columns.find((c) => c.id === columnId);
    if (!column) return;
    columns.push(columnId);
    ensureDefaults(column.id, column.params);
  }
  selectedColumns.value[tableId] = columns;
}

/**
 * Empties the selection and forgets which saved query it came from, used when
 * the catalog is replaced: the loaded query's blocks may no longer exist, so it
 * is no longer the query being worked on.
 */
function resetSelection(): void {
  selectedPrepId.value = null;
  selectedFilterIds.value = [];
  selectedTableIds.value = [];
  selectedColumns.value = {};
  paramValues.value = {};
  loadedQueryName.value = null;
  loadedIsResumable.value = false;
  savedStateJson.value = null;
  saveName.value = "";
  readOnlyXml.value = null;
}

async function onCatalogImported(imported: QueryBuilderCatalog): Promise<void> {
  catalog.value = imported;
  resetSelection();
  await CatalogStorage.save(imported);
}

async function onCatalogCleared(): Promise<void> {
  catalog.value = null;
  resetSelection();
  await CatalogStorage.clear();
  createSuccessToast(toast, t("success"), t("catalogCleared"));
}

function upsertIn<T extends { id: string }>(list: T[], block: T): void {
  const index = list.findIndex((item) => item.id === block.id);
  if (index >= 0) list[index] = block;
  else list.push(block);
}

function upsertBlock(
  cat: QueryBuilderCatalog,
  payload: SavedBlockPayload
): void {
  switch (payload.kind) {
    case "prep":
      upsertIn(cat.preps, payload.block);
      break;
    case "filter":
      upsertIn(cat.filters, payload.block);
      break;
    case "table": {
      // The editor does not manage columns; keep the existing ones on edit.
      const existing = cat.tables.find((tab) => tab.id === payload.block.id);
      upsertIn(cat.tables, {
        ...payload.block,
        columns: existing?.columns ?? []
      });
      break;
    }
    case "column": {
      const table = cat.tables.find((tab) => tab.id === payload.targetTableId);
      if (table) upsertIn(table.columns, payload.block);
      break;
    }
  }
}

/** Adds or replaces an editor block in the catalog and persists it. */
async function onBlockSaved(payload: SavedBlockPayload): Promise<void> {
  const cat = catalog.value ?? createEmptyCatalog();
  upsertBlock(cat, payload);
  catalog.value = cat;
  // Entered values may not match the (edited) params anymore.
  paramValues.value[payload.block.id] = createDefaultValues(
    payload.block.params
  );
  await CatalogStorage.save(cat);
  createSuccessToast(toast, t("success"), t("blockSaved"));
}

/** Removes a deleted block from the catalog, the selection, and the values. */
async function onBlockDeleted(payload: DeletedBlockPayload): Promise<void> {
  const cat = catalog.value;
  if (!cat) return;
  switch (payload.kind) {
    case "prep":
      cat.preps = cat.preps.filter((prep) => prep.id !== payload.blockId);
      if (selectedPrepId.value === payload.blockId) selectedPrepId.value = null;
      break;
    case "filter":
      cat.filters = cat.filters.filter(
        (filter) => filter.id !== payload.blockId
      );
      selectedFilterIds.value = selectedFilterIds.value.filter(
        (id) => id !== payload.blockId
      );
      break;
    case "table": {
      const table = cat.tables.find((tab) => tab.id === payload.blockId);
      for (const column of table?.columns ?? []) {
        delete paramValues.value[column.id];
      }
      cat.tables = cat.tables.filter((tab) => tab.id !== payload.blockId);
      selectedTableIds.value = selectedTableIds.value.filter(
        (id) => id !== payload.blockId
      );
      delete selectedColumns.value[payload.blockId];
      break;
    }
    case "column": {
      const table = cat.tables.find((tab) => tab.id === payload.targetTableId);
      if (table) {
        table.columns = table.columns.filter(
          (column) => column.id !== payload.blockId
        );
      }
      const columns = selectedColumns.value[payload.targetTableId];
      if (columns) {
        selectedColumns.value[payload.targetTableId] = columns.filter(
          (id) => id !== payload.blockId
        );
      }
      break;
    }
  }
  delete paramValues.value[payload.blockId];
  await CatalogStorage.save(cat);
  createSuccessToast(toast, t("success"), t("blockDeleted"));
}

function editPrep(): void {
  if (!selectedPrep.value) return;
  blockEditor.value?.openEdit({ kind: "prep", block: selectedPrep.value });
}

function editFilter(filter: FilterBlock): void {
  blockEditor.value?.openEdit({ kind: "filter", block: filter });
}

function editTable(table: TableBlock): void {
  blockEditor.value?.openEdit({ kind: "table", block: table });
}

function editColumn(tableId: string, column: ColumnBlock): void {
  blockEditor.value?.openEdit({
    kind: "column",
    block: column,
    targetTableId: tableId
  });
}

async function refreshSavedQueries(): Promise<void> {
  savedQueryNames.value = await window.queryBuilderFiles.listQueries();
}

/**
 * Loading happens by picking in the dropdown, never by typing a name. The
 * dropdown only displays what is loaded, so a cancelled switch needs no undo.
 */
function onQueryPicked(event: { value: string }): void {
  void loadSavedQuery(event.value);
}

/** A sidecar the app cannot read must not block viewing the query. */
function readStoredState(json: string) {
  try {
    return parseQueryState(json);
  } catch {
    // Deliberately without the error object: parse errors can quote file
    // content, which must not end up in logs.
    console.error("Failed to read stored query state");
    return null;
  }
}

/**
 * Puts the builder back into the state stored with the picked saved query,
 * asking first if that would discard unsaved changes. Queries saved without
 * that state (before it was persisted) can only be shown as read-only text,
 * which leaves the selection untouched.
 */
async function loadSavedQuery(name: string): Promise<void> {
  const [xml, stateJson] = await Promise.all([
    window.queryBuilderFiles.readQuery(name),
    window.queryBuilderFiles.readQueryState(name)
  ]);
  if (xml == null) {
    createErrorToast(toast, t("error"), t("savedQueryNotFound"));
    await refreshSavedQueries();
    return;
  }
  const state = stateJson ? readStoredState(stateJson) : null;
  if (!state) {
    readOnlyXml.value = xml;
    loadedQueryName.value = name;
    loadedIsResumable.value = false;
    createInfoToast(toast, t("info"), t("queryNotResumable"));
    return;
  }
  if (!hasUnsavedChanges.value || !loadControl.value) {
    restoreQuery(name, state);
    return;
  }
  confirm.require({
    group: "discardChanges",
    target: loadControl.value,
    message: t("confirmDiscardChanges"),
    icon: "pi pi-exclamation-triangle",
    rejectClass: "p-button-secondary p-button-outlined p-button-sm",
    acceptClass: "p-button-danger p-button-sm",
    rejectLabel: t("cancel"),
    acceptLabel: t("discard"),
    accept: () => restoreQuery(name, state)
  });
}

/** Applies a stored selection to the builder and reports what was skipped. */
function restoreQuery(name: string, state: QuerySelectionState): void {
  const restored = restoreSelection(
    state,
    catalog.value ?? createEmptyCatalog()
  );
  selectedPrepId.value = restored.selection.prepId;
  selectedFilterIds.value = restored.selection.filterIds;
  selectedTableIds.value = restored.selection.tableIds;
  selectedColumns.value = restored.selection.columnIds;
  paramValues.value = restored.selection.paramValues;
  readOnlyXml.value = null;
  loadedQueryName.value = name;
  loadedIsResumable.value = true;
  savedStateJson.value = currentStateJson.value;
  saveName.value = name;
  if (restored.dropped) {
    createInfoToast(toast, t("info"), t("queryBlocksMissing"));
    return;
  }
  createSuccessToast(toast, t("success"), t("queryLoaded", { name }));
}

/**
 * Saves the assembled XML and the block selection under the entered name. An
 * existing name that is not the loaded query is refused instead of overwritten,
 * so only the query currently being worked on can be replaced; that replacement
 * needs no confirmation because the main process keeps a backup of it.
 */
function saveQuery(): void {
  const name = saveName.value.trim();
  if (!name || !queryXml.value) return;
  if (!isValidQueryName(name)) {
    createErrorToast(toast, t("inputError"), t("invalidQueryName"));
    return;
  }
  if (
    savedQueryNames.value.includes(name) &&
    (!loadedIsResumable.value || name !== loadedQueryName.value)
  ) {
    createErrorToast(toast, t("inputError"), t("queryNameTaken", { name }));
    return;
  }
  void writeQueryFile(name);
}

async function writeQueryFile(name: string): Promise<void> {
  const stateJson = currentStateJson.value;
  try {
    await window.queryBuilderFiles.writeQuery(name, queryXml.value, stateJson);
    await refreshSavedQueries();
    // Saving makes the written query the one being worked on.
    loadedQueryName.value = name;
    loadedIsResumable.value = true;
    savedStateJson.value = stateJson;
    createSuccessToast(toast, t("success"), t("querySaved", { name }));
  } catch {
    createErrorToast(toast, t("error"), t("querySaveFailed"));
  }
}

/** Asks for confirmation, then deletes the loaded saved query. */
function confirmDeleteQuery(event: Event): void {
  const name = loadedQueryName.value;
  const target = event.currentTarget as HTMLElement | null;
  if (!name || !target) return;
  confirm.require({
    group: "savedQueryDelete",
    target,
    message: t("confirmQueryDelete", { name }),
    icon: "pi pi-exclamation-triangle",
    rejectClass: "p-button-secondary p-button-outlined p-button-sm",
    acceptClass: "p-button-danger p-button-sm",
    rejectLabel: t("cancel"),
    acceptLabel: t("delete"),
    accept: () => void deleteSavedQuery(name)
  });
}

async function deleteSavedQuery(name: string): Promise<void> {
  try {
    await window.queryBuilderFiles.deleteQuery(name);
    await refreshSavedQueries();
    // The selection stays in the builder, but it is no longer saved anywhere.
    loadedQueryName.value = null;
    loadedIsResumable.value = false;
    savedStateJson.value = null;
    readOnlyXml.value = null;
    createSuccessToast(toast, t("success"), t("queryDeleted", { name }));
  } catch {
    createErrorToast(toast, t("error"), t("queryDeleteFailed"));
  }
}

async function copyXmlToClipboard(): Promise<void> {
  if (!previewXml.value) return;
  try {
    await navigator.clipboard.writeText(previewXml.value);
    createSuccessToast(toast, t("success"), t("queryCopied"));
  } catch {
    createErrorToast(toast, t("error"), t("failedToCopy"));
  }
}

function downloadXml(): void {
  if (!previewXml.value) return;
  downloadTextFile("query.xml", "application/xml", previewXml.value);
}

onMounted(async () => {
  catalog.value = await CatalogStorage.load();
  await refreshSavedQueries();
});
</script>

<template>
  <Splitter
    state-key="builder-splitter"
    state-storage="local"
    style="height: calc(100vh - 7rem)"
  >
    <SplitterPanel :size="50" :min-size="30" class="overflow-y-auto p-3">
      <div class="flex align-items-center justify-content-between mb-3">
        <CustomBlockEditor
          ref="blockEditor"
          :catalog="catalog"
          @saved="onBlockSaved"
          @deleted="onBlockDeleted"
        />
        <CatalogManager
          :catalog="catalog"
          @imported="onCatalogImported"
          @cleared="onCatalogCleared"
        />
      </div>

      <div v-if="!catalog" class="text-color-secondary text-center p-5">
        {{ t("emptyCatalogHint") }}
      </div>

      <div v-else class="flex flex-column gap-3">
        <!-- Preparation -->
        <section class="p-3 metadata-panel">
          <div class="text-xs uppercase font-bold text-color-secondary mb-2">
            {{ t("prepSection") }}
          </div>
          <Select
            v-model="selectedPrepId"
            :options="prepOptions"
            optionLabel="label"
            optionValue="value"
            :placeholder="t('selectPrepHint')"
            class="w-full"
            @update:modelValue="onPrepSelected"
          />
          <div v-if="selectedPrep" class="mt-2">
            <span
              class="editable-label font-bold"
              v-tooltip.bottom="t('editBlock')"
              @click="editPrep"
            >
              {{ selectedPrep.label }}
            </span>
          </div>
          <div
            v-if="selectedPrep?.description"
            class="text-sm text-color-secondary mt-2"
          >
            {{ selectedPrep.description }}
          </div>
          <BlockParamFields
            v-if="selectedPrep && selectedPrep.params.length"
            class="mt-2"
            :params="selectedPrep.params"
            :values="paramValues[selectedPrep.id] ?? {}"
            @change="onPrepParamChange"
          />
        </section>

        <!-- Filters -->
        <section v-if="catalog.filters.length" class="p-3 metadata-panel">
          <div class="text-xs uppercase font-bold text-color-secondary mb-2">
            {{ t("filtersSection") }}
          </div>
          <div v-for="filter in catalog.filters" :key="filter.id" class="mb-2">
            <div class="flex align-items-center gap-2">
              <Checkbox
                :modelValue="selectedFilterIds.includes(filter.id)"
                :binary="true"
                :inputId="`filter-${filter.id}`"
                @update:modelValue="toggleFilter(filter)"
              />
              <span
                class="editable-label"
                v-tooltip.bottom="t('editBlock')"
                @click="editFilter(filter)"
              >
                {{ filter.label }}
              </span>
            </div>
            <div v-if="filter.description" class="text-sm text-color-secondary">
              {{ filter.description }}
            </div>
            <BlockParamFields
              v-if="
                selectedFilterIds.includes(filter.id) && filter.params.length
              "
              class="mt-2"
              :params="filter.params"
              :values="paramValues[filter.id] ?? {}"
              @change="(key, value) => setParamValue(filter.id, key, value)"
            />
          </div>
        </section>

        <!-- Tables -->
        <section v-if="catalog.tables.length" class="flex flex-column gap-3">
          <div class="text-xs uppercase font-bold text-color-secondary">
            {{ t("tablesSection") }}
          </div>
          <TableBlockPanel
            v-for="table in catalog.tables"
            :key="table.id"
            :block="table"
            :selected="selectedTableIds.includes(table.id)"
            :selected-column-ids="selectedColumns[table.id] ?? []"
            :param-values="paramValues"
            @toggle-table="toggleTable(table.id)"
            @toggle-column="(columnId) => toggleColumn(table.id, columnId)"
            @edit-table="editTable(table)"
            @edit-column="(column) => editColumn(table.id, column)"
            @param-change="setParamValue"
          />
        </section>
      </div>
    </SplitterPanel>

    <SplitterPanel :size="50" :min-size="25" class="overflow-hidden">
      <div class="flex flex-column h-full p-3">
        <!-- Loading a saved query: its own row, so it cannot be mistaken for
             the save name below. -->
        <div class="flex align-items-center justify-content-between gap-2 mb-2">
          <span class="text-lg font-bold">{{ t("xmlPreview") }}</span>
          <div ref="loadControl" class="flex align-items-center gap-2">
            <!-- Displays what is loaded, so cancelling a switch changes
                 nothing. -->
            <Select
              :model-value="loadedQueryName"
              :options="savedQueryNames"
              :placeholder="t('loadSavedQuery')"
              class="w-12rem"
              @change="onQueryPicked"
            />
            <Button
              icon="pi pi-trash"
              severity="danger"
              outlined
              :disabled="!loadedQueryName"
              v-tooltip.bottom="t('deleteQuery')"
              @click="confirmDeleteQuery"
            />
          </div>
        </div>

        <!-- Saving under a name, plus the actions on the previewed XML. -->
        <div class="flex align-items-center gap-2 mb-2">
          <InputText
            v-model="saveName"
            :placeholder="t('queryName')"
            class="flex-1"
          />
          <Button
            icon="pi pi-save"
            severity="secondary"
            outlined
            :disabled="!queryXml || !saveName.trim() || !!readOnlyXml"
            v-tooltip.bottom="t('saveQuery')"
            @click="saveQuery"
          />
          <span class="border-left-1 surface-border h-2rem mx-1" />
          <Button
            icon="pi pi-copy"
            severity="secondary"
            outlined
            :disabled="!previewXml"
            v-tooltip.bottom="t('copyQuery')"
            @click="copyXmlToClipboard"
          />
          <Button
            icon="pi pi-download"
            severity="secondary"
            outlined
            :disabled="!previewXml"
            v-tooltip.bottom="t('downloadXml')"
            @click="downloadXml"
          />
        </div>

        <div v-if="readOnlyXml" class="text-sm text-color-secondary mb-2">
          <i class="pi pi-lock mr-1" />{{ t("queryNotResumable") }}
        </div>
        <div
          v-if="!previewXml"
          class="text-color-secondary text-center p-5 flex-1"
        >
          {{ t("selectBlocksHint") }}
        </div>
        <pre v-else class="m-0 text-sm overflow-auto flex-1">{{
          previewXml
        }}</pre>
      </div>
    </SplitterPanel>
  </Splitter>

  <!-- Grouped so they do not collide with other confirm popups. -->
  <ConfirmPopup group="savedQueryDelete" />
  <ConfirmPopup group="discardChanges" />
</template>

<style scoped>
/* Elevated surface matching the metadata panels used across the app. */
.metadata-panel {
  background: var(--p-surface-100);
  border-radius: var(--p-content-border-radius);
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

/* Block labels double as edit triggers; hover mirrors the state-chip look. */
.editable-label {
  cursor: pointer;
  padding: 0.125rem 0.375rem;
  margin-left: -0.375rem;
  border-radius: var(--p-content-border-radius);
}
.editable-label:hover {
  background: var(--p-surface-200);
}
</style>
