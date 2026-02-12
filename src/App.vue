<template>
  <div id="app">
    <Toaster />
    <TooltipProvider>
      <RouterView />
    </TooltipProvider>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import Toaster from '@/components/ui/toaster.vue'
import TooltipProvider from '@/components/ui/TooltipProvider.vue'

onMounted(async () => {
  const authStore = useAuthStore()
  await authStore.isAuthenticated() && await authStore.getUserInfo()
})
</script>

