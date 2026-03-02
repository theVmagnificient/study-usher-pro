<template>
  <RouterLink
    :to="to"
    :class="cn(className, isActive && activeClassName, isPending && pendingClassName)"
    v-bind="$attrs"
  >
    <slot />
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { cn } from '@/lib/utils'

interface Props {
  to: string | object
  className?: string
  activeClassName?: string
  pendingClassName?: string
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
  activeClassName: '',
  pendingClassName: ''
})

const route = useRoute()
const isActive = computed(() => {
  if (typeof props.to === 'string') {
    return route.path === props.to
  }
  return false
})
const isPending = computed(() => false) // Vue Router doesn't expose pending state the same way
</script>

