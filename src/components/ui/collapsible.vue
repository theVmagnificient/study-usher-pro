<template>
  <CollapsibleRoot v-bind="$attrs">
    <slot />
  </CollapsibleRoot>
</template>

<script setup lang="ts">
import { CollapsibleRoot } from 'radix-vue'
</script>

