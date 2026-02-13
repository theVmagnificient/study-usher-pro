<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/button.vue'
import Input from '@/components/ui/input.vue'
import Label from '@/components/ui/label.vue'
import Card from '@/components/ui/card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardDescription from '@/components/ui/CardDescription.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password'
    return
  }

  isLoading.value = true

  try {
    const success = await authStore.login(email.value, password.value)

    if (success) {
      // Get redirect path from query params or use role default
      const redirectPath = (route.query.redirect as string) || getRoleDefaultPath()
      router.push(redirectPath)
    } else {
      errorMessage.value = authStore.error || 'Login failed. Please check your credentials.'
    }
  } catch (error) {
    errorMessage.value = 'An unexpected error occurred. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const getRoleDefaultPath = (): string => {
  if (!authStore.role) return '/tasks'

  switch (authStore.role) {
    case 'admin':
      return '/tasks'
    case 'reporting-radiologist':
      return '/queue'
    case 'validating-radiologist':
      return '/validation'
    default:
      return '/tasks'
  }
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleLogin()
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1">
        <CardTitle class="text-2xl font-bold text-center">
          Reporting Platform
        </CardTitle>
        <CardDescription class="text-center">
          Sign in to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="your.email@example.com"
              :disabled="isLoading"
              @keypress="handleKeyPress"
              autocomplete="email"
              required
            />
          </div>

          <div class="space-y-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              :disabled="isLoading"
              @keypress="handleKeyPress"
              autocomplete="current-password"
              required
            />
          </div>

          <div v-if="errorMessage" class="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {{ errorMessage }}
          </div>

          <Button
            type="submit"
            class="w-full"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Signing in...' : 'Sign in' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
