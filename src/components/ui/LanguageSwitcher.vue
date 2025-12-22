<template>
  <button
    @click="toggleLanguage"
    :class="cn(
      'flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors w-full',
      'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground'
    )"
  >
    <Languages class="w-4 h-4 flex-shrink-0" />
    <span v-if="!collapsed">{{ currentLanguage === 'en' ? 'Русский' : 'English' }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Languages } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface Props {
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false
})

const { locale } = useI18n()
const currentLanguage = computed(() => locale.value)

const toggleLanguage = () => {
  const newLang = locale.value === 'en' ? 'ru' : 'en'
  locale.value = newLang
  localStorage.setItem('language', newLang)
}
</script>

