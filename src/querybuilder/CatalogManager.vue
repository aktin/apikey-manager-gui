<script setup lang="ts">
/**
 * CatalogManager.vue
 *
 * Toolbar for the catalog lifecycle: import from a JSON file (validated),
 * export to a JSON file, and clearing the stored catalog after confirmation.
 * The owner holds the catalog state and receives the outcome via events.
 */
import { ref } from "vue";
import Button from "primevue/button";
import ConfirmPopup from "primevue/confirmpopup";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import { createErrorToast, createSuccessToast } from "../shared/ToastWrapper";
import { QueryBuilderCatalog } from "./CatalogTypes";
import CatalogStorage from "./CatalogStorage";
import { downloadTextFile } from "./FileTransfer";

const { t } = useI18n();
const toast = useToast();
const confirm = useConfirm();

const props = defineProps<{ catalog: QueryBuilderCatalog | null }>();
const emit = defineEmits<{
  (e: "imported", catalog: QueryBuilderCatalog): void;
  (e: "cleared"): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

async function onFilePicked(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    const catalog = CatalogStorage.parse(await file.text());
    emit("imported", catalog);
    createSuccessToast(toast, t("success"), t("catalogImported"));
  } catch (err) {
    createErrorToast(
      toast,
      t("inputError"),
      t("catalogInvalid", { reason: err instanceof Error ? err.message : "" })
    );
  }
}

function exportCatalog(): void {
  if (!props.catalog) return;
  downloadTextFile(
    "query-builder-catalog.json",
    "application/json",
    CatalogStorage.serialize(props.catalog)
  );
}

function confirmClear(event: Event): void {
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;
  confirm.require({
    group: "catalogClear",
    target,
    message: t("confirmCatalogClear"),
    icon: "pi pi-exclamation-triangle",
    rejectClass: "p-button-secondary p-button-outlined p-button-sm",
    acceptClass: "p-button-danger p-button-sm",
    rejectLabel: t("cancel"),
    acceptLabel: t("catalogClear"),
    accept: () => emit("cleared")
  });
}
</script>

<template>
  <div class="flex align-items-center gap-2">
    <input
      ref="fileInput"
      type="file"
      accept=".json,application/json"
      class="hidden"
      @change="onFilePicked"
    />
    <Button
      icon="pi pi-upload"
      severity="secondary"
      outlined
      v-tooltip.bottom="t('catalogImport')"
      @click="fileInput?.click()"
    />
    <Button
      icon="pi pi-download"
      severity="secondary"
      outlined
      :disabled="!props.catalog"
      v-tooltip.bottom="t('catalogExport')"
      @click="exportCatalog"
    />
    <Button
      icon="pi pi-trash"
      severity="danger"
      outlined
      :disabled="!props.catalog"
      v-tooltip.bottom="t('catalogClear')"
      @click="confirmClear"
    />
  </div>

  <!-- Grouped so it does not collide with other confirm popups. -->
  <ConfirmPopup group="catalogClear" />
</template>
