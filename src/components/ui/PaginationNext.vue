<template>
  <PaginationLink aria-label="Go to next page" size="default" :class="cn('gap-1 pr-2.5', className)" v-bind="$attrs">
    <span>Next</span>
    <ChevronRight class="h-4 w-4" />
  </PaginationLink>
</template>

<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import PaginationLink from './PaginationLink.vue'

interface Props {
  className?: string
}

withDefaults(defineProps<Props>(), {
  className: ''
})
</script>

