<script setup lang="ts">
/**
 * BlockParamFields.vue
 *
 * Renders the input fields for a block's declared parameters, one field per
 * param based on its type (date, number, text, list, choice). Emits a
 * `change` event per edited field; the owner keeps the value state.
 */
import DatePicker from "primevue/datepicker";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import InputChips from "primevue/inputchips";
import Select from "primevue/select";
import { BlockParam } from "./CatalogTypes";
import { ParamValues } from "./QueryXmlAssembler";

const props = defineProps<{ params: BlockParam[]; values: ParamValues }>();
const emit = defineEmits<{
  (e: "change", key: string, value: ParamValues[string]): void;
}>();

/** Date params are stored as "yyyy-mm-dd" strings for SQL templates. */
function toIsoDate(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromIsoDate(value: ParamValues[string]): Date | null {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function asString(value: ParamValues[string]): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: ParamValues[string]): number | null {
  return typeof value === "number" ? value : null;
}

function asList(value: ParamValues[string]): string[] {
  return Array.isArray(value) ? value : [];
}

const choiceOptions = (param: BlockParam) =>
  (param.options ?? []).map((option) => ({ label: option, value: option }));
</script>

<template>
  <div class="flex flex-column gap-2">
    <div v-for="param in props.params" :key="param.key">
      <label
        :for="`param-${param.key}`"
        class="block mb-1 text-sm text-color-secondary"
      >
        {{ param.label }}
      </label>

      <DatePicker
        v-if="param.type === 'date'"
        :id="`param-${param.key}`"
        :modelValue="fromIsoDate(props.values[param.key])"
        showIcon
        class="w-full"
        @update:modelValue="
          emit('change', param.key, toIsoDate($event as Date | null))
        "
      />
      <InputNumber
        v-else-if="param.type === 'number'"
        :inputId="`param-${param.key}`"
        :modelValue="asNumber(props.values[param.key])"
        :useGrouping="false"
        class="w-full"
        @update:modelValue="emit('change', param.key, $event)"
      />
      <InputChips
        v-else-if="param.type === 'list'"
        :inputId="`param-${param.key}`"
        :modelValue="asList(props.values[param.key])"
        class="w-full"
        @update:modelValue="emit('change', param.key, $event)"
      />
      <Select
        v-else-if="param.type === 'choice'"
        :id="`param-${param.key}`"
        :modelValue="asString(props.values[param.key])"
        :options="choiceOptions(param)"
        optionLabel="label"
        optionValue="value"
        class="w-full"
        @update:modelValue="emit('change', param.key, $event)"
      />
      <InputText
        v-else
        :id="`param-${param.key}`"
        :modelValue="asString(props.values[param.key])"
        class="w-full"
        @update:modelValue="emit('change', param.key, $event ?? '')"
      />
    </div>
  </div>
</template>
