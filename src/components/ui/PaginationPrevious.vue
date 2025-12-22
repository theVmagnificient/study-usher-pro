<template>
  <PaginationLink aria-label="Go to previous page" size="default" :class="cn('gap-1 pl-2.5', className)" v-bind="$attrs">
    <ChevronLeft class="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
</template>

<script setup lang="ts">
import { ChevronLeft } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import PaginationLink from './PaginationLink.vue'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

