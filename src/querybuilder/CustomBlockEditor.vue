<script setup lang="ts">
/**
 * CustomBlockEditor.vue
 *
 * Self-contained block editor: a button that opens a modal dialog for
 * defining a new catalog block (prep, filter, table, or column) with its SQL
 * template and parameter declarations. Existing blocks can be edited via the
 * exposed `openEdit` — the block kind is fixed and the id is kept, so saving
 * replaces the block. Emits the finished block via `saved`; the owner
 * adds/replaces it in the catalog and persists it.
 */
import { computed, ref } from "vue";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import ConfirmPopup from "primevue/confirmpopup";
import Dialog from "primevue/dialog";
import InputChips from "primevue/inputchips";
import InputText from "primevue/inputtext";
import Select from "primevue/select";
import Textarea from "primevue/textarea";
import { useConfirm } from "primevue/useconfirm";
import { useI18n } from "vue-i18n";
import {
  BlockParam,
  ColumnBlock,
  FilterBlock,
  ParamType,
  PrepBlock,
  QueryBuilderCatalog,
  TableBlock
} from "./CatalogTypes";

export type BlockKind = "prep" | "filter" | "table" | "column";

export type SavedBlockPayload =
  | { kind: "prep"; block: PrepBlock }
  | { kind: "filter"; block: FilterBlock }
  | { kind: "table"; block: TableBlock }
  | { kind: "column"; block: ColumnBlock; targetTableId: string };

export type DeletedBlockPayload =
  | { kind: "prep" | "filter" | "table"; blockId: string }
  | { kind: "column"; blockId: string; targetTableId: string };

/**
 * Editor-side draft of a BlockParam: `defaultValue` and `options` are edited
 * as plain text and converted on save (see buildParams; options split at
 * commas, empty values are omitted).
 */
interface ParamDraft {
  key: string;
  label: string;
  type: ParamType;
  defaultValue: string;
  options: string;
}

const { t } = useI18n();
const confirm = useConfirm();

const props = defineProps<{ catalog: QueryBuilderCatalog | null }>();
const emit = defineEmits<{
  (e: "saved", payload: SavedBlockPayload): void;
  (e: "deleted", payload: DeletedBlockPayload): void;
}>();

const visible = ref(false);

// Id of the block being edited; null while creating a new block.
const editingId = ref<string | null>(null);

const kind = ref<BlockKind>("column");
const label = ref("");
const description = ref("");
const sql = ref("");
const tempTables = ref<string[]>([]);
const tableName = ref("");
const destination = ref("");
const anonymizeEnabled = ref(false);
const anonymizeColumn = ref("");
const anonymizeRole = ref<"key" | "ref">("ref");
const targetTableId = ref<string | null>(null);
const params = ref<ParamDraft[]>([]);

const kindOptions = computed(() => [
  { label: t("kindPrep"), value: "prep" },
  { label: t("kindFilter"), value: "filter" },
  { label: t("kindTable"), value: "table" },
  { label: t("kindColumn"), value: "column" }
]);

const typeOptions = computed(() => [
  { label: t("typeDate"), value: "date" },
  { label: t("typeNumber"), value: "number" },
  { label: t("typeText"), value: "text" },
  { label: t("typeList"), value: "list" },
  { label: t("typeChoice"), value: "choice" }
]);

const roleOptions = computed(() => [
  { label: t("roleKey"), value: "key" },
  { label: t("roleRef"), value: "ref" }
]);

const tableOptions = computed(() =>
  (props.catalog?.tables ?? []).map((table) => ({
    label: table.label,
    value: table.id
  }))
);

function hasValidParamKeys(drafts: ParamDraft[]): boolean {
  const keys = drafts.map((draft) => draft.key.trim());
  return keys.every(Boolean) && new Set(keys).size === keys.length;
}

function hasChoiceOptions(drafts: ParamDraft[]): boolean {
  return drafts.every(
    (draft) => draft.type !== "choice" || draft.options.trim() !== ""
  );
}

const paramsValid = computed(
  () => hasValidParamKeys(params.value) && hasChoiceOptions(params.value)
);

const tableFieldsValid = computed(() => {
  if (kind.value !== "table") return true;
  if (!tableName.value.trim() || !destination.value.trim()) return false;
  return !anonymizeEnabled.value || anonymizeColumn.value.trim() !== "";
});

const columnFieldsValid = computed(
  () => kind.value !== "column" || targetTableId.value != null
);

const canSave = computed(
  () =>
    label.value.trim() !== "" &&
    sql.value.trim() !== "" &&
    paramsValid.value &&
    tableFieldsValid.value &&
    columnFieldsValid.value
);

function addParam(): void {
  params.value.push({
    key: "",
    label: "",
    type: "text",
    defaultValue: "",
    options: ""
  });
}

function removeParam(index: number): void {
  params.value.splice(index, 1);
}

function resetForm(): void {
  editingId.value = null;
  kind.value = "column";
  label.value = "";
  description.value = "";
  sql.value = "";
  tempTables.value = [];
  tableName.value = "";
  destination.value = "";
  anonymizeEnabled.value = false;
  anonymizeColumn.value = "";
  anonymizeRole.value = "ref";
  targetTableId.value = null;
  params.value = [];
}

function paramsToDrafts(blockParams: BlockParam[]): ParamDraft[] {
  return blockParams.map((param) => ({
    key: param.key,
    label: param.label,
    type: param.type,
    defaultValue: param.default ?? "",
    options: param.options?.join(", ") ?? ""
  }));
}

function openCreate(): void {
  // Only discard leftover edit state; an unsaved create draft deliberately
  // survives closing and reopening the dialog.
  if (editingId.value) resetForm();
  visible.value = true;
}

/** Opens the dialog prefilled with an existing block for editing. */
function openEdit(payload: SavedBlockPayload): void {
  resetForm();
  editingId.value = payload.block.id;
  kind.value = payload.kind;
  label.value = payload.block.label;
  description.value = payload.block.description ?? "";
  sql.value = payload.block.sql;
  params.value = paramsToDrafts(payload.block.params);
  if (payload.kind === "prep") {
    tempTables.value = [...payload.block.tempTables];
  } else if (payload.kind === "table") {
    tableName.value = payload.block.tableName;
    destination.value = payload.block.destination;
    anonymizeEnabled.value = payload.block.anonymize != null;
    anonymizeColumn.value = payload.block.anonymize?.column ?? "";
    anonymizeRole.value = payload.block.anonymize?.role ?? "ref";
  } else if (payload.kind === "column") {
    targetTableId.value = payload.targetTableId;
  }
  visible.value = true;
}

defineExpose({ openEdit });

function buildParams(): BlockParam[] {
  return params.value.map((draft) => ({
    key: draft.key.trim(),
    label: draft.label.trim() || draft.key.trim(),
    type: draft.type,
    ...(draft.defaultValue.trim()
      ? { default: draft.defaultValue.trim() }
      : {}),
    ...(draft.type === "choice"
      ? {
          options: draft.options
            .split(",")
            .map((option) => option.trim())
            .filter(Boolean)
        }
      : {})
  }));
}

/** Builds the fields shared by all block kinds; keeps the id when editing. */
function buildBaseBlock(): FilterBlock {
  return {
    id: editingId.value ?? crypto.randomUUID(),
    label: label.value.trim(),
    ...(description.value.trim()
      ? { description: description.value.trim() }
      : {}),
    sql: sql.value,
    params: buildParams()
  };
}

function buildTableBlock(base: FilterBlock): TableBlock {
  return {
    ...base,
    tableName: tableName.value.trim(),
    destination: destination.value.trim(),
    ...(anonymizeEnabled.value
      ? {
          anonymize: {
            column: anonymizeColumn.value.trim(),
            role: anonymizeRole.value
          }
        }
      : {}),
    columns: []
  };
}

function buildPayload(): SavedBlockPayload {
  const base = buildBaseBlock();
  switch (kind.value) {
    case "prep":
      return {
        kind: "prep",
        block: { ...base, tempTables: [...tempTables.value] }
      };
    case "filter":
      return { kind: "filter", block: base };
    case "table":
      return { kind: "table", block: buildTableBlock(base) };
    case "column":
      return {
        kind: "column",
        block: base,
        targetTableId: targetTableId.value!
      };
  }
}

function save(): void {
  emit("saved", buildPayload());
  resetForm();
  visible.value = false;
}

function buildDeletePayload(): DeletedBlockPayload {
  const blockId = editingId.value!;
  if (kind.value === "column") {
    return { kind: "column", blockId, targetTableId: targetTableId.value! };
  }
  return { kind: kind.value, blockId };
}

/** Asks for confirmation, then hands the delete to the owner. */
function confirmDeleteBlock(event: Event): void {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;
  confirm.require({
    group: "blockDelete",
    target,
    message: t("confirmBlockDelete"),
    icon: "pi pi-exclamation-triangle",
    rejectClass: "p-button-secondary p-button-outlined p-button-sm",
    acceptClass: "p-button-danger p-button-sm",
    rejectLabel: t("cancel"),
    acceptLabel: t("delete"),
    accept: () => {
      emit("deleted", buildDeletePayload());
      resetForm();
      visible.value = false;
    }
  });
}
</script>

<template>
  <Button
    icon="pi pi-plus"
    severity="secondary"
    outlined
    v-tooltip.bottom="t('addCustomBlock')"
    @click="openCreate"
  />

  <Dialog
    v-model:visible="visible"
    modal
    :header="editingId ? t('editBlock') : t('addCustomBlock')"
    :style="{ width: '90vw', maxWidth: '46rem' }"
  >
    <div class="flex flex-column gap-3">
      <div>
        <label for="blockKind" class="block mb-1 text-sm text-color-secondary">
          {{ t("blockKind") }}
        </label>
        <Select
          id="blockKind"
          v-model="kind"
          :options="kindOptions"
          optionLabel="label"
          optionValue="value"
          :disabled="editingId != null"
          class="w-full"
        />
      </div>

      <div>
        <label for="blockLabel" class="block mb-1 text-sm text-color-secondary">
          {{ t("blockLabel") }}
        </label>
        <InputText id="blockLabel" v-model="label" class="w-full" />
      </div>

      <div>
        <label
          for="blockDescription"
          class="block mb-1 text-sm text-color-secondary"
        >
          {{ t("descriptionSection") }}
        </label>
        <Textarea
          id="blockDescription"
          v-model="description"
          rows="2"
          autoResize
          class="w-full"
        />
      </div>

      <div v-if="kind === 'prep'">
        <label
          for="prepTempTables"
          class="block mb-1 text-sm text-color-secondary"
        >
          {{ t("tempTablesLabel") }}
        </label>
        <InputChips
          inputId="prepTempTables"
          v-model="tempTables"
          class="w-full"
        />
      </div>

      <div v-if="kind === 'table'" class="flex flex-column gap-3">
        <div class="flex flex-column md:flex-row gap-3">
          <div class="w-full">
            <label
              for="tableNameInput"
              class="block mb-1 text-sm text-color-secondary"
            >
              {{ t("tableNameLabel") }}
            </label>
            <InputText id="tableNameInput" v-model="tableName" class="w-full" />
          </div>
          <div class="w-full">
            <label
              for="destinationInput"
              class="block mb-1 text-sm text-color-secondary"
            >
              {{ t("destinationLabel") }}
            </label>
            <InputText
              id="destinationInput"
              v-model="destination"
              class="w-full"
            />
          </div>
        </div>
        <div class="flex align-items-center gap-2">
          <Checkbox
            v-model="anonymizeEnabled"
            :binary="true"
            inputId="anonymizeEnabled"
          />
          <label for="anonymizeEnabled">{{ t("anonymizeEnabled") }}</label>
        </div>
        <div v-if="anonymizeEnabled" class="flex flex-column md:flex-row gap-3">
          <div class="w-full">
            <label
              for="anonymizeColumnInput"
              class="block mb-1 text-sm text-color-secondary"
            >
              {{ t("anonymizeColumnLabel") }}
            </label>
            <InputText
              id="anonymizeColumnInput"
              v-model="anonymizeColumn"
              class="w-full"
            />
          </div>
          <div class="w-full">
            <label
              for="anonymizeRoleInput"
              class="block mb-1 text-sm text-color-secondary"
            >
              {{ t("anonymizeRoleLabel") }}
            </label>
            <Select
              id="anonymizeRoleInput"
              v-model="anonymizeRole"
              :options="roleOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
        </div>
      </div>

      <div v-if="kind === 'column'">
        <label
          for="targetTableInput"
          class="block mb-1 text-sm text-color-secondary"
        >
          {{ t("targetTable") }}
        </label>
        <Select
          id="targetTableInput"
          v-model="targetTableId"
          :options="tableOptions"
          optionLabel="label"
          optionValue="value"
          :disabled="editingId != null"
          class="w-full"
        />
      </div>

      <div>
        <label for="sqlInput" class="block mb-1 text-sm text-color-secondary">
          {{ t("sqlTemplateLabel") }}
        </label>
        <Textarea
          id="sqlInput"
          v-model="sql"
          rows="8"
          class="w-full font-mono"
        />
        <div class="text-sm text-color-secondary mt-1">
          {{ t("sqlTemplateHint") }}
        </div>
      </div>

      <section class="flex flex-column gap-2">
        <div class="text-xs uppercase font-bold text-color-secondary">
          {{ t("parametersSection") }}
        </div>
        <div
          v-for="(param, index) in params"
          :key="index"
          class="flex flex-wrap align-items-end gap-2"
        >
          <div class="flex-1">
            <label class="block mb-1 text-sm text-color-secondary">
              {{ t("paramKey") }}
            </label>
            <InputText v-model="param.key" class="w-full" />
          </div>
          <div class="flex-1">
            <label class="block mb-1 text-sm text-color-secondary">
              {{ t("paramLabel") }}
            </label>
            <InputText v-model="param.label" class="w-full" />
          </div>
          <div class="flex-1">
            <label class="block mb-1 text-sm text-color-secondary">
              {{ t("paramType") }}
            </label>
            <Select
              v-model="param.type"
              :options="typeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
          <div class="flex-1">
            <label class="block mb-1 text-sm text-color-secondary">
              {{ t("paramDefault") }}
            </label>
            <InputText v-model="param.defaultValue" class="w-full" />
          </div>
          <div v-if="param.type === 'choice'" class="flex-1">
            <label class="block mb-1 text-sm text-color-secondary">
              {{ t("paramOptions") }}
            </label>
            <InputText v-model="param.options" class="w-full" />
          </div>
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            @click="removeParam(index)"
          />
        </div>
        <Button
          :label="t('addParam')"
          icon="pi pi-plus"
          severity="secondary"
          text
          class="align-self-start"
          @click="addParam"
        />
      </section>
    </div>

    <template #footer>
      <Button
        v-if="editingId"
        :label="t('delete')"
        severity="danger"
        outlined
        class="mr-auto"
        @click="confirmDeleteBlock"
      />
      <Button
        :label="t('cancel')"
        severity="secondary"
        text
        @click="visible = false"
      />
      <Button :label="t('saveBlock')" :disabled="!canSave" @click="save" />
    </template>
  </Dialog>

  <!-- Grouped so it does not collide with other confirm popups. -->
  <ConfirmPopup group="blockDelete" />
</template>
