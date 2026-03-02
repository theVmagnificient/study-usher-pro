<template>
  <AspectRatioRoot v-bind="$attrs">
    <slot />
  </AspectRatioRoot>
</template>

<script setup lang="ts">
import { AspectRatioRoot } from 'radix-vue'
</script>

