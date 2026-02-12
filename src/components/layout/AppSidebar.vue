<template>
  <aside
    :class="cn(
      'h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200 border-r border-sidebar-border flex-shrink-0',
      collapsed ? 'w-16' : 'w-60'
    )"
  >
    <!-- Header -->
    <div class="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
      <div v-if="!collapsed" class="flex items-center gap-2">
        <div class="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center">
          <FileText class="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <span class="font-semibold text-sm">RadReport</span>
      </div>
      <button
        @click="collapsed = !collapsed"
        class="p-1.5 rounded hover:bg-sidebar-accent transition-colors"
      >
        <ChevronRight v-if="collapsed" class="w-4 h-4" />
        <ChevronLeft v-else class="w-4 h-4" />
      </button>
    </div>

    <!-- Role Display (Read-only) -->
    <div v-if="!collapsed" class="px-3 py-3 border-b border-sidebar-border">
      <label class="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 block mb-1.5">
        {{ t('sidebar.activeRole') }}
      </label>
      <div class="w-full text-xs bg-sidebar-accent text-sidebar-foreground rounded px-2 py-1.5">
        {{ currentRole ? roleLabels[currentRole] : '' }}
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 py-3 overflow-y-auto scrollbar-thin">
      <ul class="space-y-0.5 px-2">
        <li v-for="item in filteredItems" :key="item.path">
          <RouterLink
            :to="item.path"
            :class="cn(
              'flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors',
              isActive(item.path)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground'
            )"
          >
            <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
            <span v-if="!collapsed">{{ t(item.labelKey) }}</span>
          </RouterLink>
        </li>
      </ul>
    </nav>

    <!-- Language Toggle -->
    <div class="px-3 py-2 border-t border-sidebar-border">
      <LanguageSwitcher :collapsed="collapsed" />
    </div>

    <!-- Theme Toggle -->
    <div class="px-3 py-2 border-t border-sidebar-border">
      <button
        @click="toggleTheme"
        :class="cn(
          'flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors w-full',
          'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground'
        )"
      >
        <Sun v-if="isDark" class="w-4 h-4 flex-shrink-0" />
        <Moon v-else class="w-4 h-4 flex-shrink-0" />
        <span v-if="!collapsed">{{ isDark ? t('sidebar.lightMode') : t('sidebar.darkMode') }}</span>
      </button>
    </div>

    <!-- Footer -->
    <div class="border-t border-sidebar-border p-3">
      <div v-if="!collapsed" class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
          <User class="w-4 h-4" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ authStore.fullName }}</p>
          <p class="text-[10px] text-sidebar-foreground/60 truncate">
            {{ currentRole ? roleLabels[currentRole] : '' }}
          </p>
        </div>
        <button @click="handleLogout" class="p-1.5 rounded hover:bg-sidebar-accent transition-colors">
          <LogOut class="w-4 h-4" />
        </button>
      </div>
      <button v-else @click="handleLogout" class="w-full p-2 rounded hover:bg-sidebar-accent transition-colors flex justify-center">
        <LogOut class="w-4 h-4" />
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ClipboardList,
  CheckSquare,
  CalendarDays,
  Activity,
  FolderCog,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Moon,
  Sun,
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher.vue'
import type { UserRole } from '@/types/study'

interface NavItem {
  labelKey: string
  path: string
  icon: any
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { labelKey: 'nav.studyList', path: '/tasks', icon: FileText, roles: ['admin'] },
  { labelKey: 'nav.taskTypes', path: '/task-types', icon: FolderCog, roles: ['admin'] },
  { labelKey: 'nav.userManagement', path: '/users', icon: Users, roles: ['admin'] },
  { labelKey: 'nav.workforceCapacity', path: '/workforce', icon: CalendarDays, roles: ['admin'] },
  { labelKey: 'nav.auditLog', path: '/audit', icon: Activity, roles: ['admin'] },
  { labelKey: 'nav.slaDashboard', path: '/sla', icon: LayoutDashboard, roles: ['admin'] },
  { labelKey: 'nav.myQueue', path: '/queue', icon: ClipboardList, roles: ['reporting-radiologist'] },
  { labelKey: 'nav.validationQueue', path: '/validation', icon: CheckSquare, roles: ['validating-radiologist', 'admin'] },
  { labelKey: 'nav.myProfile', path: '/profile', icon: User, roles: ['reporting-radiologist', 'validating-radiologist'] },
]

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const appStore = useAppStore()
const authStore = useAuthStore()

const collapsed = ref(false)
const isDark = computed(() => appStore.isDark)
const currentRole = computed(() => authStore.role)

const filteredItems = computed(() => {
  if (!currentRole.value) return []
  return navItems.filter((item) => item.roles.includes(currentRole.value!))
})

const roleLabels = computed(() => ({
  admin: t('roles.admin'),
  'reporting-radiologist': t('roles.reportingRadiologist'),
  'validating-radiologist': t('roles.validatingRadiologist'),
}))

const isActive = (path: string) => route.path === path

const toggleTheme = () => {
  appStore.toggleTheme()
}

const handleLogout = () => {
  authStore.signOut()
  router.push('/login')
}
</script>

