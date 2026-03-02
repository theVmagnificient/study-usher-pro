<template>
  <div class="flex h-screen w-full bg-background overflow-hidden">
    <AppSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <header class="h-14 border-b border-border bg-card flex items-center justify-end px-6">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" @click="toggleTheme">
              <Sun v-if="isDark" class="w-5 h-5" />
              <Moon v-else class="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{{ t('common.toggleTheme') }}</p>
          </TooltipContent>
        </Tooltip>
      </header>
      <main class="flex-1 overflow-auto">
        <div class="p-6">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { computed } from 'vue'
import { Moon, Sun } from 'lucide-vue-next'
import AppSidebar from './AppSidebar.vue'
import Button from '@/components/ui/button.vue'
import Tooltip from '@/components/ui/tooltip.vue'
import TooltipTrigger from '@/components/ui/TooltipTrigger.vue'
import TooltipContent from '@/components/ui/TooltipContent.vue'

const { t } = useI18n()
const appStore = useAppStore()
const isDark = computed(() => appStore.isDark)

const toggleTheme = () => {
  appStore.toggleTheme()
}

// Keyboard shortcut: Ctrl+D to toggle theme
let handleKeyDown: ((e: KeyboardEvent) => void) | null = null

onMounted(() => {
  handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault()
      toggleTheme()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  if (handleKeyDown) {
    window.removeEventListener('keydown', handleKeyDown)
  }
})
</script>

