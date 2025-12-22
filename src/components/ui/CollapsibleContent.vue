<template>
  <CollapsibleContentRoot v-bind="$attrs">
    <slot />
  </CollapsibleContentRoot>
</template>

<script setup lang="ts">
import { CollapsibleContentRoot } from 'radix-vue'
</script>

