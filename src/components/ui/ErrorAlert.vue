<template>
  <div v-if="error" class="clinical-card p-4 border-l-4" :class="alertClasses">
    <div class="flex items-start gap-3">
      <component :is="icon" class="w-5 h-5 flex-shrink-0 mt-0.5" :class="iconClasses" />
      <div class="flex-1">
        <h4 class="text-sm font-semibold mb-1" :class="titleClasses">
          {{ title }}
        </h4>
        <p class="text-sm" :class="messageClasses">
          {{ error }}
        </p>
        <div v-if="showRetry" class="mt-3">
          <Button
            variant="outline"
            size="sm"
            @click="$emit('retry')"
            :disabled="retrying"
          >
            <RefreshCw v-if="!retrying" class="w-4 h-4 mr-2" />
            <Loader2 v-else class="w-4 h-4 mr-2 animate-spin" />
            {{ retrying ? 'Retrying...' : 'Try Again' }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AlertCircle, WifiOff, ServerCrash, Clock, ShieldAlert, Loader2, RefreshCw } from 'lucide-vue-next'
import Button from './button.vue'
import { ApiErrorType, type ApiError } from '@/lib/api/client'

interface Props {
  error: string | ApiError | null
  showRetry?: boolean
  retrying?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRetry: true,
  retrying: false,
})

defineEmits<{
  retry: []
}>()

const errorType = computed(() => {
  if (!props.error) return null
  if (typeof props.error === 'string') return ApiErrorType.UNKNOWN
  return (props.error as ApiError).type
})

const title = computed(() => {
  switch (errorType.value) {
    case ApiErrorType.NETWORK:
      return 'Connection Problem'
    case ApiErrorType.SERVER:
      return 'Server Error'
    case ApiErrorType.TIMEOUT:
      return 'Request Timeout'
    case ApiErrorType.UNAUTHORIZED:
      return 'Authorization Required'
    case ApiErrorType.NOT_FOUND:
      return 'Not Found'
    case ApiErrorType.VALIDATION:
      return 'Validation Error'
    default:
      return 'Error'
  }
})

const icon = computed(() => {
  switch (errorType.value) {
    case ApiErrorType.NETWORK:
      return WifiOff
    case ApiErrorType.SERVER:
      return ServerCrash
    case ApiErrorType.TIMEOUT:
      return Clock
    case ApiErrorType.UNAUTHORIZED:
      return ShieldAlert
    default:
      return AlertCircle
  }
})

const alertClasses = computed(() => {
  switch (errorType.value) {
    case ApiErrorType.NETWORK:
      return 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20'
    case ApiErrorType.UNAUTHORIZED:
      return 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20'
    default:
      return 'border-l-destructive bg-destructive/10'
  }
})

const iconClasses = computed(() => {
  switch (errorType.value) {
    case ApiErrorType.NETWORK:
      return 'text-amber-600 dark:text-amber-500'
    case ApiErrorType.UNAUTHORIZED:
      return 'text-orange-600 dark:text-orange-500'
    default:
      return 'text-destructive'
  }
})

const titleClasses = computed(() => {
  switch (errorType.value) {
    case ApiErrorType.NETWORK:
      return 'text-amber-900 dark:text-amber-300'
    case ApiErrorType.UNAUTHORIZED:
      return 'text-orange-900 dark:text-orange-300'
    default:
      return 'text-destructive'
  }
})

const messageClasses = computed(() => {
  switch (errorType.value) {
    case ApiErrorType.NETWORK:
      return 'text-amber-800 dark:text-amber-400'
    case ApiErrorType.UNAUTHORIZED:
      return 'text-orange-800 dark:text-orange-400'
    default:
      return 'text-destructive/90'
  }
})
</script>
