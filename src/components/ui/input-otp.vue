<template>
  <div
    :class="cn('flex items-center gap-2 has-[:disabled]:opacity-50', containerClassName)"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  containerClassName?: string
  className?: string
}

withDefaults(defineProps<Props>(), {
  containerClassName: '',
  className: ''
})
</script>

