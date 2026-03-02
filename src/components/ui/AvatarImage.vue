<template>
  <AvatarImageRoot
    :class="cn('aspect-square h-full w-full', className)"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { AvatarImageRoot } from 'radix-vue'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

