<template>
  <div>
    <PageHeader
      :title="t('auditLog.title')"
      :subtitle="auditStore.loading ? t('common.loading') : t('auditLog.subtitle', { count: auditStore.auditLog.length })"
    />

    <!-- Loading State -->
    <div v-if="auditStore.loading" class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="auditStore.error" class="p-4 bg-red-50 text-red-600 rounded-md mb-6">
      {{ auditStore.error }}
    </div>

    <!-- Content -->
    <div v-else class="clinical-card overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('auditLog.headers.timestamp') }}</th>
            <th>{{ t('auditLog.headers.studyId') }}</th>
            <th>{{ t('auditLog.headers.action') }}</th>
            <th>{{ t('auditLog.headers.statusChange') }}</th>
            <th>{{ t('auditLog.headers.user') }}</th>
            <th>{{ t('auditLog.headers.comment') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in auditStore.auditLog" :key="entry.id">
            <td class="text-sm text-muted-foreground whitespace-nowrap">
              {{ format(new Date(entry.timestamp), "MMM dd, yyyy HH:mm") }}
            </td>
            <td class="font-mono text-xs font-medium">{{ entry.studyId }}</td>
            <td class="text-sm">{{ entry.action }}</td>
            <td>
              <div v-if="entry.previousStatus && entry.newStatus" class="flex items-center gap-2">
                <StatusBadge :status="entry.previousStatus" />
                <span class="text-muted-foreground">→</span>
                <StatusBadge :status="entry.newStatus" />
              </div>
            </td>
            <td class="text-sm">{{ entry.user }}</td>
            <td>
              <div v-if="entry.comment" class="flex items-start gap-2 max-w-xs">
                <MessageSquare class="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span class="text-sm text-muted-foreground line-clamp-2">{{ entry.comment }}</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { format } from 'date-fns'
import { MessageSquare } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAuditStore } from '@/stores/auditStore'

const { t } = useI18n()
const auditStore = useAuditStore()

onMounted(async () => {
  await auditStore.fetchAuditLog()
})
</script>
