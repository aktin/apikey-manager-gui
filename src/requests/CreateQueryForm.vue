<script setup lang="ts">
/**
 * CreateQueryForm.vue
 *
 * Self-contained "create query" feature: an icon button that opens a modal
 * dialog holding the query-creation form, grouped into cards (request, tags,
 * principal, schedule, query).
 *
 * Features:
 * - Single- or repeated-execution schedule, toggled inline
 * - Optional restriction to selected target nodes, loaded lazily on first open,
 *   with a select-all toggle and a checkbox per node
 * - Validates required fields and that the query definition is well-formed XML
 * - Allocates, defines, optionally targets, and publishes the request in one step
 * - Clears the form and closes the dialog on success, emitting `created`
 * - Displays toast messages on success/error
 */
import { computed, ref, watch } from "vue";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Select from "primevue/select";
import SelectButton from "primevue/selectbutton";
import Listbox from "primevue/listbox";
import Badge from "primevue/badge";
import DatePicker from "primevue/datepicker";
import Checkbox from "primevue/checkbox";
import { useToast } from "primevue/usetoast";
import { useI18n } from "vue-i18n";
import BrokerConnection from "../broker/BrokerConnection";
import {
  parseXmlBrokerNodeList,
  parseXmlBrokerRequest,
  parseXmlBrokerRequestInfo,
  parseXmlBrokerRequestTargetNodes
} from "../broker/Parser";
import { buildNodesXml, buildQueryRequestXml } from "./QueryXmlBuilder";
import {
  BrokerRequest,
  CreateQueryPayload,
  RequestQuerySummary
} from "./BrokerRequest";
import { NodeListEntry } from "../nodes/BrokerNode";
import { MomentDuration } from "../shared/MomentWrapper";
import { createErrorToast, createSuccessToast } from "../shared/ToastWrapper";
import { notifyStatusError } from "../shared/StatusToast";

const { t } = useI18n();
const toast = useToast();

const props = defineProps<{ requests: RequestQuerySummary[] }>();
const emit = defineEmits<{ (e: "created"): void }>();

const visible = ref(false);

// Prefill source
const loadSourceId = ref<number | null>(null);

// Saved query-builder queries, offered for the query definition field
const savedQueries = ref<string[]>([]);
const selectedSavedQuery = ref<string | null>(null);

// Request
const title = ref("");
const description = ref("");
const tagsInput = ref("");

// Principal
const principalName = ref("");
const principalOrg = ref("");
const principalEmail = ref("");

// Schedule
const reference = ref<Date | null>(null);
const scheduled = ref<Date | null>(null);
// Collection period as unsigned ISO-8601 period; the direction flag decides
// whether it ends at (before) or starts at (after) the reference date.
const duration = ref("P24M");
const durationBefore = ref(true);
const isSeries = ref(false);
const interval = ref("");
const intervalHours = ref("");
const seriesId = ref("");

// Query definition
const queryXml = ref("");

// Target nodes
const limitToNodes = ref(false);
const selectedNodes = ref<number[]>([]);
const nodes = ref<NodeListEntry[]>([]);

// Date-based ISO-8601 period (years, months, weeks, days), as the DWH parses it.
const ISO_PERIOD = /^P(?=\d)(\d+Y)?(\d+M)?(\d+W)?(\d+D)?$/;

const durationValid = computed(() => ISO_PERIOD.test(duration.value.trim()));

const durationDirectionOptions = computed(() => [
  { label: t("durationBefore"), value: true },
  { label: t("durationAfter"), value: false }
]);

const nodeOptions = computed(() =>
  nodes.value.map((n) => ({ label: n.cn ?? `#${n.id}`, value: n.id }))
);

const requestOptions = computed(() =>
  props.requests.map((r) => ({ label: `#${r.id}`, value: r.id }))
);

// Select-all mirror for the node list: reads whether every node is selected,
// writes either the full or the empty selection.
const allNodesSelected = computed({
  get: () =>
    nodes.value.length > 0 && selectedNodes.value.length === nodes.value.length,
  set: (select: boolean) => {
    selectedNodes.value = select ? nodes.value.map((n) => n.id) : [];
  }
});

const someNodesSelected = computed(
  () => selectedNodes.value.length > 0 && !allNodesSelected.value
);

// Create button is enabled only when all required fields are filled.
const canCreate = computed(
  () =>
    reference.value != null &&
    scheduled.value != null &&
    title.value.trim() !== "" &&
    tagsInput.value.trim() !== "" &&
    principalName.value.trim() !== "" &&
    principalEmail.value.trim() !== "" &&
    durationValid.value &&
    queryXml.value.trim() !== "" &&
    (!isSeries.value || interval.value.trim() !== "") &&
    (!limitToNodes.value || selectedNodes.value.length > 0)
);

// Load the target-node options once, the first time the dialog opens; refresh
// the saved-query names on every open (they may change between openings).
watch(visible, async (open) => {
  if (!open) return;
  savedQueries.value = await window.queryBuilderFiles.listQueries();
  if (nodes.value.length === 0) {
    const resp = await BrokerConnection.getBrokerNodeList();
    if (resp.status === 200) {
      nodes.value = parseXmlBrokerNodeList(resp.data);
    }
  }
});

/** Fills the query definition field from a saved query-builder query. */
async function loadSavedQuery(name: string): Promise<void> {
  const content = await window.queryBuilderFiles.readQuery(name);
  if (content == null) {
    createErrorToast(toast, t("error"), t("savedQueryNotFound"));
    return;
  }
  queryXml.value = content;
}

/** Reports whether the query definition parses as well-formed XML. */
function isValidXml(xml: string): boolean {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  return doc.getElementsByTagName("parsererror").length === 0;
}

function isValidDate(date: Date): boolean {
  return !isNaN(date.getTime());
}

/** Splits a parsed duration into its unsigned ISO period and direction. */
function applyDuration(value: MomentDuration): void {
  const iso = value.toISOString();
  durationBefore.value = iso.startsWith("-");
  duration.value = iso.replace(/^-/, "");
}

/** Prefills the form from an existing request, for cloning and resubmitting. */
function prefill(req: BrokerRequest) {
  const q = req.query;
  title.value = q.title;
  description.value = q.description;
  tagsInput.value = q.principal.tags.join(", ");
  principalName.value = q.principal.name ?? "";
  principalOrg.value = q.principal.organisation ?? "";
  principalEmail.value = q.principal.email ?? "";
  reference.value = isValidDate(req.referenceDate) ? req.referenceDate : null;
  scheduled.value = isValidDate(req.scheduledDate) ? req.scheduledDate : null;
  queryXml.value = q.queryXml;
  if (q.repeatedExecution) {
    isSeries.value = true;
    applyDuration(q.repeatedExecution.duration);
    interval.value = q.repeatedExecution.interval.asMilliseconds()
      ? q.repeatedExecution.interval.toISOString()
      : "";
    intervalHours.value =
      q.repeatedExecution.intervalHours != null
        ? String(q.repeatedExecution.intervalHours)
        : "";
    seriesId.value =
      q.repeatedExecution.id != null ? String(q.repeatedExecution.id) : "";
  } else {
    isSeries.value = false;
    if (q.singleExecution) applyDuration(q.singleExecution.duration);
    else duration.value = "";
    interval.value = "";
    intervalHours.value = "";
    seriesId.value = "";
  }
}

/** Prefills the target-node selection from the source request's targeting. */
async function loadTargetNodes(id: number): Promise<void> {
  limitToNodes.value = false;
  selectedNodes.value = [];
  const info = await BrokerConnection.getBrokerRequestInfo(String(id));
  if (info.status !== 200) {
    notifyStatusError(toast, t, info.status, {});
    return;
  }
  if (!parseXmlBrokerRequestInfo(info.data).targeted) return;
  const nodesResp = await BrokerConnection.getBrokerRequestTargetNodes(
    String(id)
  );
  if (nodesResp.status !== 200) {
    notifyStatusError(toast, t, nodesResp.status, {});
    return;
  }
  limitToNodes.value = true;
  selectedNodes.value = parseXmlBrokerRequestTargetNodes(nodesResp.data);
}

/** Fetches the chosen request's definition and prefills the form from it. */
async function loadFromRequest(id: number) {
  const resp = await BrokerConnection.getBrokerRequest(String(id));
  if (resp.status !== 200) {
    notifyStatusError(toast, t, resp.status, {});
    return;
  }
  prefill(parseXmlBrokerRequest(resp.data));
  await loadTargetNodes(id);
}

function buildPayload(): CreateQueryPayload {
  const tags = tagsInput.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return {
    reference: reference.value!,
    scheduled: scheduled.value!,
    title: title.value.trim(),
    description: description.value.trim(),
    queryXml: queryXml.value.trim(),
    principal: {
      name: principalName.value.trim() || null,
      organisation: principalOrg.value.trim() || null,
      email: principalEmail.value.trim() || null,
      phone: null,
      tags
    },
    duration: (durationBefore.value ? "-" : "") + duration.value.trim(),
    repeated: isSeries.value
      ? {
          interval: interval.value.trim(),
          intervalHours: intervalHours.value.trim()
            ? Number(intervalHours.value)
            : null,
          seriesId: seriesId.value.trim() ? Number(seriesId.value) : null
        }
      : null,
    targetNodeIds:
      limitToNodes.value && selectedNodes.value.length > 0
        ? selectedNodes.value
        : null
  };
}

function resetForm() {
  loadSourceId.value = null;
  selectedSavedQuery.value = null;
  title.value = "";
  description.value = "";
  tagsInput.value = "";
  principalName.value = "";
  principalOrg.value = "";
  principalEmail.value = "";
  reference.value = null;
  scheduled.value = null;
  duration.value = "P24M";
  durationBefore.value = true;
  isSeries.value = false;
  interval.value = "";
  intervalHours.value = "";
  seriesId.value = "";
  queryXml.value = "";
  limitToNodes.value = false;
  selectedNodes.value = [];
}

async function createQuery() {
  if (!isValidXml(queryXml.value.trim())) {
    createErrorToast(toast, t("inputError"), t("invalidQueryXml"));
    return;
  }
  const payload = buildPayload();
  const nodesXml = payload.targetNodeIds
    ? buildNodesXml(payload.targetNodeIds)
    : null;
  const { status, id } = await BrokerConnection.createBrokerRequest(
    (requestId) => buildQueryRequestXml(requestId, payload),
    nodesXml
  );
  if (status === 201) {
    createSuccessToast(toast, t("success"), t("queryCreated", { id }));
    resetForm();
    visible.value = false;
    emit("created");
    return;
  }
  notifyStatusError(toast, t, status, {});
}
</script>

<template>
  <Button
    icon="pi pi-plus"
    @click="visible = true"
    v-tooltip.bottom="t('createQuery')"
    class="flex-shrink-0"
  />

  <Dialog
    v-model:visible="visible"
    modal
    :header="t('createQuery')"
    :style="{ width: '90vw', maxWidth: '64rem' }"
    :contentStyle="{ maxHeight: '76vh', overflowY: 'auto' }"
  >
    <div class="flex flex-column gap-3">
      <!-- Clone an existing request into the form -->
      <div v-if="requestOptions.length" class="flex flex-column gap-1">
        <label class="text-sm text-color-secondary">
          {{ t("loadFromRequestHint") }}
        </label>
        <Select
          v-model="loadSourceId"
          :options="requestOptions"
          optionLabel="label"
          optionValue="value"
          :placeholder="t('loadFromRequest')"
          filter
          class="w-full"
          @change="loadFromRequest($event.value)"
        />
      </div>

      <!-- Request: title + description -->
      <section class="p-3 metadata-panel">
        <div class="text-xs uppercase font-bold text-color-secondary mb-3">
          {{ t("request") }}
        </div>
        <div class="flex flex-column gap-3">
          <div>
            <label
              for="titleInput"
              class="block mb-1 text-sm text-color-secondary"
            >
              {{ t("queryTitle") }}
            </label>
            <InputText id="titleInput" v-model="title" class="w-full" />
          </div>
          <div>
            <label
              for="descriptionInput"
              class="block mb-1 text-sm text-color-secondary"
            >
              {{ t("descriptionSection") }}
            </label>
            <Textarea
              id="descriptionInput"
              v-model="description"
              rows="6"
              autoResize
              class="w-full"
            />
          </div>
        </div>
      </section>

      <!-- Tags -->
      <section class="p-3 metadata-panel">
        <div class="text-xs uppercase font-bold text-color-secondary mb-3">
          {{ t("tags") }}
        </div>
        <InputText
          v-model="tagsInput"
          :placeholder="t('commaSeparated')"
          class="w-full"
        />
      </section>

      <!-- Principal -->
      <section class="p-3 metadata-panel">
        <div class="text-xs uppercase font-bold text-color-secondary mb-3">
          {{ t("principal") }}
        </div>
        <div class="flex flex-column md:flex-row gap-3">
          <div class="w-full">
            <label
              for="pNameInput"
              class="block mb-1 text-sm text-color-secondary"
            >
              {{ t("name") }}
            </label>
            <InputText id="pNameInput" v-model="principalName" class="w-full" />
          </div>
          <div class="w-full">
            <label
              for="pOrgInput"
              class="block mb-1 text-sm text-color-secondary"
            >
              {{ t("o") }}
            </label>
            <InputText id="pOrgInput" v-model="principalOrg" class="w-full" />
          </div>
          <div class="w-full">
            <label
              for="pEmailInput"
              class="block mb-1 text-sm text-color-secondary"
            >
              {{ t("email") }}
            </label>
            <InputText
              id="pEmailInput"
              v-model="principalEmail"
              class="w-full"
            />
          </div>
        </div>
      </section>

      <!-- Schedule: dates + series type -->
      <section class="p-3 metadata-panel">
        <div class="text-xs uppercase font-bold text-color-secondary mb-3">
          {{ t("scheduleSection") }}
        </div>
        <div class="flex flex-column gap-3">
          <div class="flex flex-column md:flex-row gap-3">
            <div class="w-full">
              <label
                for="referenceInput"
                class="block mb-1 text-sm text-color-secondary"
              >
                {{ t("referenceDate") }}
              </label>
              <DatePicker
                id="referenceInput"
                v-model="reference"
                showTime
                hourFormat="24"
                showIcon
                class="w-full"
              />
            </div>
            <div class="w-full">
              <label
                for="scheduledInput"
                class="block mb-1 text-sm text-color-secondary"
              >
                {{ t("scheduledDate") }}
              </label>
              <DatePicker
                id="scheduledInput"
                v-model="scheduled"
                showIcon
                class="w-full"
              />
            </div>
          </div>
          <div>
            <label
              for="durationInput"
              class="block mb-1 text-sm text-color-secondary"
            >
              {{ t("duration") }}
            </label>
            <div class="flex gap-2">
              <SelectButton
                v-model="durationBefore"
                :options="durationDirectionOptions"
                optionLabel="label"
                optionValue="value"
                :allowEmpty="false"
              />
              <InputText
                id="durationInput"
                v-model="duration"
                :invalid="duration.trim() !== '' && !durationValid"
                class="w-full"
              />
            </div>
            <small class="text-color-secondary">{{ t("durationHint") }}</small>
          </div>
          <div class="flex align-items-center gap-2">
            <Checkbox v-model="isSeries" :binary="true" inputId="isSeries" />
            <label for="isSeries">{{ t("seriesRequest") }}</label>
          </div>
          <div v-if="isSeries" class="flex flex-column md:flex-row gap-3">
            <div class="w-full">
              <label
                for="intervalInput"
                class="block mb-1 text-sm text-color-secondary"
              >
                {{ t("interval") }}
              </label>
              <InputText id="intervalInput" v-model="interval" class="w-full" />
            </div>
            <div class="w-full">
              <label
                for="intervalHoursInput"
                class="block mb-1 text-sm text-color-secondary"
              >
                {{ t("intervalHours") }}
              </label>
              <InputText
                id="intervalHoursInput"
                v-model="intervalHours"
                class="w-full"
              />
            </div>
            <div class="w-full">
              <label
                for="seriesIdInput"
                class="block mb-1 text-sm text-color-secondary"
              >
                {{ t("seriesId") }}
              </label>
              <InputText id="seriesIdInput" v-model="seriesId" class="w-full" />
            </div>
          </div>
        </div>
      </section>

      <!-- Query definition -->
      <section class="p-3 metadata-panel">
        <div class="text-xs uppercase font-bold text-color-secondary mb-3">
          {{ t("querySection") }}
        </div>
        <div class="flex flex-column gap-3">
          <!-- Fill the query definition from a saved query-builder query -->
          <div v-if="savedQueries.length">
            <label
              for="savedQueryInput"
              class="block mb-1 text-sm text-color-secondary"
            >
              {{ t("loadSavedQueryHint") }}
            </label>
            <Select
              id="savedQueryInput"
              v-model="selectedSavedQuery"
              :options="savedQueries"
              :placeholder="t('loadSavedQuery')"
              filter
              class="w-full"
              @change="loadSavedQuery($event.value)"
            />
          </div>
          <Textarea
            v-model="queryXml"
            :placeholder="t('queryXmlLabel')"
            rows="28"
            class="w-full font-mono"
          />
        </div>
      </section>

      <!-- Target nodes -->
      <section class="p-3 metadata-panel">
        <div class="flex align-items-center justify-content-between mb-3">
          <div class="text-xs uppercase font-bold text-color-secondary">
            {{ t("targetedRequest") }}
          </div>
          <Badge
            v-if="limitToNodes"
            :value="t('nodesSelectedCount', { count: selectedNodes.length })"
            severity="secondary"
          />
        </div>
        <div class="flex flex-column gap-3">
          <div class="flex align-items-center gap-2">
            <Checkbox
              v-model="limitToNodes"
              :binary="true"
              inputId="limitToNodes"
            />
            <label for="limitToNodes">{{ t("limitToNodesLabel") }}</label>
          </div>
          <template v-if="limitToNodes">
            <div class="flex align-items-center gap-2">
              <Checkbox
                v-model="allNodesSelected"
                :binary="true"
                :indeterminate="someNodesSelected"
                inputId="selectAllNodes"
              />
              <label for="selectAllNodes">{{ t("selectAllNodesLabel") }}</label>
            </div>
            <Listbox
              v-model="selectedNodes"
              :options="nodeOptions"
              optionLabel="label"
              optionValue="value"
              multiple
              filter
              :filterPlaceholder="t('keywordSearch')"
              :emptyFilterMessage="t('emptyNodeList')"
              listStyle="max-height: 20rem"
              class="w-full"
            >
              <!-- Display-only checkbox: the row click owns the selection, so
                   clicks must pass through to the listbox item. -->
              <template #option="{ option, selected }">
                <div class="flex align-items-center gap-2">
                  <Checkbox
                    :model-value="selected"
                    :binary="true"
                    tabindex="-1"
                    style="pointer-events: none"
                  />
                  <span>{{ option.label }}</span>
                </div>
              </template>
            </Listbox>
          </template>
        </div>
      </section>
    </div>

    <template #footer>
      <Button
        :label="t('clearForm')"
        severity="secondary"
        text
        @click="resetForm"
      />
      <Button
        :label="t('createQuery')"
        @click="createQuery"
        :disabled="!canCreate"
      />
    </template>
  </Dialog>
</template>

<style scoped>
/*
 * Section panels as elevated surfaces (matching BrokerRequestViewer): a grey
 * fill plus a soft shadow instead of a 1px border, which renders "dog-ear"
 * corner artifacts in Chromium (Electron) when combined with border-radius.
 */
.metadata-panel {
  background: var(--p-surface-100);
  border-radius: var(--p-content-border-radius);
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}
</style>
