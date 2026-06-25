<script setup lang="ts">
/**
 * Error404.vue
 *
 * Route view for unknown paths; renders ErrorCommon with 404 content.
 */
import { useI18n } from "vue-i18n";
import ErrorCommon from "./ErrorCommon.vue";

const { t } = useI18n();
</script>

<template>
  <ErrorCommon
    code="404"
    :title="t('error404Title')"
    kaomoji=" ┐(￣～￣)┌"
    :description="t('error404Description')"
  />
</template>
