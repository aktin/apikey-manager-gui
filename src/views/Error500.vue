<script setup lang="ts">
/**
 * Error500.vue
 *
 * Route view for server errors; renders ErrorCommon with 500 content.
 */
import ErrorCommon from "./ErrorCommon.vue";
</script>

<template>
  <ErrorCommon
    code="500"
    title="Internal Server Error"
    kaomoji="ヽ(￣д￣;)ノ=3=3=3"
    description="Sorry, the server is currently having a bit of a meltdown"
  />
</template>
