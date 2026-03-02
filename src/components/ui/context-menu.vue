<template>
  <ContextMenuRoot v-bind="$attrs">
    <slot />
  </ContextMenuRoot>
</template>

<script setup lang="ts">
import { ContextMenuRoot } from 'radix-vue'
</script>

