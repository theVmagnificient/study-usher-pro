<template>
  <div id="app">
    <Toaster />
    <TooltipProvider>
      <RouterView />
    </TooltipProvider>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import Toaster from '@/components/ui/toaster.vue'
import TooltipProvider from '@/components/ui/TooltipProvider.vue'
</script>

