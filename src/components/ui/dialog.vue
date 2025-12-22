<template>
  <DialogRoot :open="open" @update:open="$emit('update:open', $event)">
    <slot />
  </DialogRoot>
</template>

<script setup lang="ts">
import { DialogRoot } from 'radix-vue'

interface Props {
  open?: boolean
}

withDefaults(defineProps<Props>(), {
  open: false
})

defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

