<template>
  <div
    :class="cn(
      'relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md',
      isActive && 'z-10 ring-2 ring-ring ring-offset-background',
      className
    )"
    v-bind="$attrs"
  >
    {{ char }}
    <div v-if="hasFakeCaret" class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div class="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  index: number
  char?: string
  hasFakeCaret?: boolean
  isActive?: boolean
  className?: string
}

withDefaults(defineProps<Props>(), {
  char: '',
  hasFakeCaret: false,
  isActive: false,
  className: ''
})
</script>

