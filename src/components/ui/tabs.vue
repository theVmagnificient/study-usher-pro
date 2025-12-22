<template>
  <TabsRoot 
    :model-value="modelValue ?? defaultValue"
    @update:modelValue="handleUpdate"
    :class="className"
  >
    <slot />
  </TabsRoot>
</template>

<script setup lang="ts">
import { TabsRoot } from 'radix-vue'

interface Props {
  modelValue?: string
  defaultValue?: string
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  defaultValue: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const handleUpdate = (value: string) => {
  emit('update:modelValue', value)
}
</script>

