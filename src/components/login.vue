<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter();

const goToPage = () => {
  router.push('/')
}
</script>

<template>
  <p style="color:red ; font-size:30px ; outline: #FF0000 solid 10px;">login screen</p>
  <Button @click="goToPage">go to home</Button>
</template>