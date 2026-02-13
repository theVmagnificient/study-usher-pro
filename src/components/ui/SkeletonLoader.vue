<template>
  <div :class="cn('animate-pulse bg-muted rounded', className)" :style="style"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  width?: string
  height?: string
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: '100%',
  height: '1rem',
})

const style = computed(() => ({
  width: props.width,
  height: props.height,
}))
</script>
