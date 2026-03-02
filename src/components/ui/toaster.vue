<template>
  <ToastProvider>
    <Toast
      v-for="toast in toasts"
      :key="toast.id"
      :variant="toast.variant"
      :class="toast.className"
    >
      <div class="grid gap-1">
        <ToastTitle v-if="toast.title">{{ toast.title }}</ToastTitle>
        <ToastDescription v-if="toast.description">{{ toast.description }}</ToastDescription>
      </div>
      <component :is="toast.action" v-if="toast.action" />
      <ToastClose />
    </Toast>
    <ToastViewport />
  </ToastProvider>
</template>

<script setup lang="ts">
import { useToast } from '@/hooks/use-toast'
import ToastProvider from '@/components/ui/ToastProvider.vue'
import Toast from '@/components/ui/toast.vue'
import ToastTitle from '@/components/ui/ToastTitle.vue'
import ToastDescription from '@/components/ui/ToastDescription.vue'
import ToastClose from '@/components/ui/ToastClose.vue'
import ToastViewport from '@/components/ui/ToastViewport.vue'

const { toasts } = useToast()
</script>

