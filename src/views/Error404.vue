<script setup lang="ts">
/**
 * Error404.vue
 *
 * Route view for unknown paths; renders ErrorCommon with 404 content.
 */
import ErrorCommon from "./ErrorCommon.vue";
</script>

<template>
  <ErrorCommon
    code="404"
    title="Not Found"
    kaomoji=" ┐(￣～￣)┌"
    description="This page is playing hide-and-seek and it's winning"
  />
</template>
