<script setup lang="ts">
/**
 * QueryBuilderView.vue
 *
 * Route view for composing a broker query from catalog blocks: catalog
 * management (import/export/clear, custom blocks) and block selection on the
 * left, a live XML preview with copy/download on the right. The catalog is
 * persisted via CatalogStorage; the selection is view-local state.
 */
import { computed, onMounted, ref, watch } from "vue";
import Button from "primevue/button";
import Select from "primevue/select";
import Checkbox from "primevue/checkbox";
import ConfirmPopup from "primevue/confirmpopup";
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import { createErrorToast, createSuccessToast } from "../shared/ToastWrapper";
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

const queryName = ref("");
const savedQueryNames = ref<string[]>([]);
// Content and name of the loaded saved query; the preview shows the content
// instead of the live assembly until the block selection changes.
const loadedQueryXml = ref<string | null>(null);
const loadedQueryName = ref<string | null>(null);

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

/** What the preview pane and its actions operate on. */
const previewXml = computed(() => loadedQueryXml.value ?? queryXml.value);

// Changing the live selection discards a loaded saved query.
watch(selection, () => {
  loadedQueryXml.value = null;
  loadedQueryName.value = null;
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

function resetSelection(): void {
  selectedPrepId.value = null;
  selectedFilterIds.value = [];
  selectedTableIds.value = [];
  selectedColumns.value = {};
  paramValues.value = {};
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

// Delete only applies to a name that actually exists as a saved query.
const isPersistedName = computed(() =>
  savedQueryNames.value.includes(queryName.value.trim())
);

/**
 * Picking an option in the editable name field loads that saved query into
 * the preview; plain typing only sets the save name (the editable Select
 * reports typing as an "input" originalEvent), so a loaded query can be
 * saved under a new name as a copy.
 */
function onQueryFieldChange(event: {
  originalEvent: Event;
  value: string;
}): void {
  if (event.originalEvent?.type === "input") return;
  void loadSavedQuery(event.value);
}

/** Shows the picked saved query in the preview (read-only). */
async function loadSavedQuery(name: string): Promise<void> {
  const content = await window.queryBuilderFiles.readQuery(name);
  if (content == null) {
    createErrorToast(toast, t("error"), t("savedQueryNotFound"));
    loadedQueryXml.value = null;
    loadedQueryName.value = null;
    await refreshSavedQueries();
    return;
  }
  loadedQueryXml.value = content;
  loadedQueryName.value = name;
}

/** Saves the previewed XML under the entered name; confirms overwrites. */
function saveQuery(event: Event): void {
  const name = queryName.value.trim();
  if (!name || !previewXml.value) return;
  if (!isValidQueryName(name)) {
    createErrorToast(toast, t("inputError"), t("invalidQueryName"));
    return;
  }
  if (!savedQueryNames.value.includes(name)) {
    void writeQueryFile(name);
    return;
  }
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;
  confirm.require({
    group: "queryOverwrite",
    target,
    message: t("confirmQueryOverwrite"),
    icon: "pi pi-exclamation-triangle",
    rejectClass: "p-button-secondary p-button-outlined p-button-sm",
    acceptClass: "p-button-danger p-button-sm",
    rejectLabel: t("cancel"),
    acceptLabel: t("overwrite"),
    accept: () => void writeQueryFile(name)
  });
}

async function writeQueryFile(name: string): Promise<void> {
  try {
    await window.queryBuilderFiles.writeQuery(name, previewXml.value);
    await refreshSavedQueries();
    createSuccessToast(toast, t("success"), t("querySaved", { name }));
  } catch {
    createErrorToast(toast, t("error"), t("querySaveFailed"));
  }
}

/** Asks for confirmation, then deletes the saved query named in the field. */
function confirmDeleteQuery(event: Event): void {
  const name = queryName.value.trim();
  const target = event.currentTarget as HTMLElement | null;
  if (!isPersistedName.value || !name || !target) return;
  confirm.require({
    group: "savedQueryDelete",
    target,
    message: t("confirmQueryDelete"),
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
    if (loadedQueryName.value === name) {
      loadedQueryXml.value = null;
      loadedQueryName.value = null;
    }
    if (queryName.value.trim() === name) queryName.value = "";
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
        <div class="flex align-items-center justify-content-between gap-2 mb-2">
          <span class="text-lg font-bold">{{ t("xmlPreview") }}</span>
          <div class="flex align-items-center flex-wrap gap-2">
            <Select
              v-model="queryName"
              :options="savedQueryNames"
              editable
              :placeholder="t('queryName')"
              class="w-14rem"
              @change="onQueryFieldChange"
            />
            <Button
              icon="pi pi-save"
              severity="secondary"
              outlined
              :disabled="!previewXml || !queryName.trim()"
              v-tooltip.bottom="t('saveQuery')"
              @click="saveQuery"
            />
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
            <Button
              icon="pi pi-trash"
              severity="danger"
              outlined
              :disabled="!isPersistedName"
              v-tooltip.bottom="t('deleteQuery')"
              @click="confirmDeleteQuery"
            />
          </div>
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
  <ConfirmPopup group="queryOverwrite" />
  <ConfirmPopup group="savedQueryDelete" />
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
