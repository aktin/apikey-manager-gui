<script setup lang="ts">
/**
 * Error500.vue
 *
 * Route view for server errors; renders ErrorCommon with 500 content.
 */
import { useI18n } from "vue-i18n";
import ErrorCommon from "./ErrorCommon.vue";

const { t } = useI18n();
</script>

<template>
  <ErrorCommon
    code="500"
    :title="t('error500Title')"
    kaomoji="ヽ(￣д￣;)ノ=3=3=3"
    :description="t('error500Description')"
  />
</template>
