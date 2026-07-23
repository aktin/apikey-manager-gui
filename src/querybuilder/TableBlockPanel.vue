<script setup lang="ts">
/**
 * TableBlockPanel.vue
 *
 * Selection panel for one catalog table block: a checkbox to include the
 * table, its parameter fields, and one checkbox (plus parameter fields) per
 * available column block. Selection and parameter state live in the owner.
 */
import Checkbox from "primevue/checkbox";
import { useI18n } from "vue-i18n";
import { ColumnBlock, TableBlock } from "./CatalogTypes";
import { ParamValues } from "./QueryXmlAssembler";
import BlockParamFields from "./BlockParamFields.vue";

const { t } = useI18n();

const props = defineProps<{
  block: TableBlock;
  selected: boolean;
  selectedColumnIds: string[];
  paramValues: Record<string, ParamValues>;
}>();
const emit = defineEmits<{
  (e: "toggle-table"): void;
  (e: "toggle-column", columnId: string): void;
  (e: "edit-table"): void;
  (e: "edit-column", column: ColumnBlock): void;
  (
    e: "param-change",
    blockId: string,
    key: string,
    value: ParamValues[string]
  ): void;
}>();
</script>

<template>
  <div class="p-3 metadata-panel">
    <div class="flex align-items-center gap-2">
      <Checkbox
        :modelValue="props.selected"
        :binary="true"
        :inputId="`table-${props.block.id}`"
        @update:modelValue="emit('toggle-table')"
      />
      <span
        class="editable-label font-bold"
        v-tooltip.bottom="t('editBlock')"
        @click="emit('edit-table')"
      >
        {{ props.block.label }}
      </span>
    </div>
    <div
      v-if="props.block.description"
      class="text-sm text-color-secondary mt-1"
    >
      {{ props.block.description }}
    </div>

    <template v-if="props.selected">
      <BlockParamFields
        v-if="props.block.params.length"
        class="mt-2"
        :params="props.block.params"
        :values="props.paramValues[props.block.id] ?? {}"
        @change="
          (key, value) => emit('param-change', props.block.id, key, value)
        "
      />

      <div
        v-for="column in props.block.columns"
        :key="column.id"
        class="mt-2 ml-4"
      >
        <div class="flex align-items-center gap-2">
          <Checkbox
            :modelValue="props.selectedColumnIds.includes(column.id)"
            :binary="true"
            :inputId="`column-${column.id}`"
            @update:modelValue="emit('toggle-column', column.id)"
          />
          <span
            class="editable-label"
            v-tooltip.bottom="t('editBlock')"
            @click="emit('edit-column', column)"
          >
            {{ column.label }}
          </span>
        </div>
        <div v-if="column.description" class="text-sm text-color-secondary">
          {{ column.description }}
        </div>
        <BlockParamFields
          v-if="
            props.selectedColumnIds.includes(column.id) && column.params.length
          "
          class="mt-2"
          :params="column.params"
          :values="props.paramValues[column.id] ?? {}"
          @change="(key, value) => emit('param-change', column.id, key, value)"
        />
      </div>
    </template>
  </div>
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
