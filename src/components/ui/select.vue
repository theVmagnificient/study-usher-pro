<template>
  <SelectRoot :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <slot />
  </SelectRoot>
</template>

<script setup lang="ts">
import { SelectRoot } from 'radix-vue'

interface Props {
  modelValue?: string
  className?: string
}

defineProps<Props>()
defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>
