<template>
  <TooltipProvider>
    <slot />
  </TooltipProvider>
</template>

<script setup lang="ts">
import { TooltipProvider } from 'radix-vue'
</script>

