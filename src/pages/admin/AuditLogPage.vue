<template>
  <div>
    <PageHeader
      title="Audit Log"
      subtitle="Complete history of all study status changes"
    />

    <div class="clinical-card overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Study ID</th>
            <th>Action</th>
            <th>Status Change</th>
            <th>User</th>
            <th>Comment</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in mockAuditLog" :key="entry.id">
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
import { format } from 'date-fns'
import { MessageSquare } from 'lucide-vue-next'
import PageHeader from '@/components/layout/PageHeader.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { mockAuditLog } from '@/data/mockData'
</script>
