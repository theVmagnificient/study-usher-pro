<template>
  <tr>
    <td v-for="i in columns" :key="i" class="px-6 py-4">
      <SkeletonLoader :width="getColumnWidth(i)" height="1rem" />
    </td>
  </tr>
</template>

<script setup lang="ts">
import SkeletonLoader from '../SkeletonLoader.vue'

interface Props {
  columns: number
  columnWidths?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  columns: 5,
  columnWidths: () => [],
})

function getColumnWidth(index: number): string {
  if (props.columnWidths && props.columnWidths[index - 1]) {
    return props.columnWidths[index - 1]
  }

  if (index === 1) return '60%'
  if (index === props.columns) return '30%'
  return '40%'
}
</script>
