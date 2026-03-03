import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, FileText, Users, ClipboardList, CheckSquare,
  CalendarDays, Activity, FolderCog, ChevronLeft, ChevronRight,
  User, LogOut, Moon, Sun, LayoutTemplate,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/authStore'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import type { UserRole } from '@/types/study'

interface NavItem {
  labelKey: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { labelKey: 'nav.studyList', path: '/tasks', icon: FileText, roles: ['admin'] },
  { labelKey: 'nav.taskTypes', path: '/task-types', icon: FolderCog, roles: ['admin'] },
  { labelKey: 'nav.templates', path: '/templates', icon: LayoutTemplate, roles: ['admin'] },
  { labelKey: 'nav.userManagement', path: '/users', icon: Users, roles: ['admin'] },
  { labelKey: 'nav.workforceCapacity', path: '/workforce', icon: CalendarDays, roles: ['admin'] },
  { labelKey: 'nav.auditLog', path: '/audit', icon: Activity, roles: ['admin'] },
  { labelKey: 'nav.slaDashboard', path: '/sla', icon: LayoutDashboard, roles: ['admin'] },
  { labelKey: 'nav.myQueue', path: '/queue', icon: ClipboardList, roles: ['reporting-radiologist'] },
  { labelKey: 'nav.validationQueue', path: '/validation', icon: CheckSquare, roles: ['validating-radiologist', 'admin'] },
  { labelKey: 'nav.myProfile', path: '/profile', icon: User, roles: ['reporting-radiologist', 'validating-radiologist'] },
]

export default function AppSidebar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const appStore = useAppStore()
  const authStore = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const isDark = appStore.isDark()
  const currentRole = authStore.user.role
  const fullName = authStore.fullName()

  const filteredItems = navItems.filter(item => currentRole && item.roles.includes(currentRole))

  const roleLabels: Record<UserRole, string> = {
    admin: t('roles.admin'),
    'reporting-radiologist': t('roles.reportingRadiologist'),
    'validating-radiologist': t('roles.validatingRadiologist'),
  }

  function handleLogout() {
    authStore.signOut().then(() => navigate('/login'))
  }

  return (
    <aside className={cn(
      'h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200 border-r border-sidebar-border flex-shrink-0',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center">
              <FileText className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">RadReport</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="p-1.5 rounded hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Display */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-sidebar-border">
          <label className="text-[10px] uppercase tracking-wider text-sidebar-foreground/60 block mb-1.5">
            {t('sidebar.activeRole')}
          </label>
          <div className="w-full text-xs bg-sidebar-accent text-sidebar-foreground rounded px-2 py-1.5">
            {currentRole ? roleLabels[currentRole] : ''}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {filteredItems.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground'
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Language Toggle */}
      <div className="px-3 py-2 border-t border-sidebar-border">
        <LanguageSwitcher collapsed={collapsed} />
      </div>

      {/* Theme Toggle */}
      <div className="px-3 py-2 border-t border-sidebar-border">
        <button
          onClick={() => appStore.toggleTheme()}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors w-full',
            'hover:bg-sidebar-accent text-sidebar-foreground/80 hover:text-sidebar-foreground'
          )}
        >
          {isDark ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
          {!collapsed && <span>{isDark ? t('sidebar.lightMode') : t('sidebar.darkMode')}</span>}
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fullName}</p>
              <p className="text-[10px] text-sidebar-foreground/60 truncate">
                {currentRole ? roleLabels[currentRole] : ''}
              </p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded hover:bg-sidebar-accent transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button onClick={handleLogout} className="w-full p-2 rounded hover:bg-sidebar-accent transition-colors flex justify-center">
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  )
}
