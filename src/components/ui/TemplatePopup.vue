<template>
  <div
    v-if="show && templates.length > 0"
    data-template-popup
    class="absolute z-50 mt-1 max-h-48 w-64 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md p-1"
    :style="positionStyle"
  >
    <ul v-if="templates.length > 0" role="listbox">
      <li
        v-for="(template, index) in templates"
        :key="template.id"
        role="option"
        :aria-selected="index === activeIndex"
        :class="[
          'px-3 py-2 text-sm cursor-pointer rounded-sm',
          index === activeIndex
            ? 'bg-accent text-accent-foreground'
            : 'hover:bg-accent hover:text-accent-foreground'
        ]"
        @click="$emit('select', template)"
        @mouseenter="$emit('update:activeIndex', index)"
      >
        {{ template.label }}
      </li>
    </ul>
    <p v-else class="px-3 py-2 text-sm text-muted-foreground italic">
      {{ emptyText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ReportTemplate } from '@/data/reportTemplates'

const props = defineProps<{
  show: boolean
  templates: ReportTemplate[]
  activeIndex: number
  emptyText: string
  anchorPosition?: 'below' | 'above'
}>()

defineEmits<{
  select: [template: ReportTemplate]
  'update:activeIndex': [index: number]
}>()

const positionStyle = computed(() => {
  return {
    top: '100%',
    left: '0',
  }
})
</script>
