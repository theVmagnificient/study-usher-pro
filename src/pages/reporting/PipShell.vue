<template>
  <TooltipProvider>
    <Toaster />
    <div class="pip-shell min-h-full bg-background">
      <ReportingPage />
    </div>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { provide } from 'vue'
import ReportingPage from './ReportingPage.vue'
import Toaster from '@/components/ui/toaster.vue'
import TooltipProvider from '@/components/ui/TooltipProvider.vue'

provide('pipMode', true)
</script>
