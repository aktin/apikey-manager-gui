<script setup lang="ts">
import ApplicationHeader from "./components/ApplicationHeader.vue";
import Toast from "primevue/toast";
</script>

<template>
  <Toast/>
  <div id="app" class="flex flex-column h-screen">
    <ApplicationHeader/>
    <main class="m-3">
      <router-view></router-view>
    </main>
  </div>
</template>
