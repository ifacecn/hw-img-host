<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Lock, Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!password.value.trim()) {
    error.value = '请输入管理密码'
    return
  }
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.value }),
    })

    if (!response.ok) {
      // HTTP 错误状态
      console.error('登录接口状态码:', response.status)
      error.value = `网络错误 (${response.status})`
      return
    }

    const result = await response.json()
    console.log('登录接口返回:', result)

    if (result.code === 0) {
      sessionStorage.setItem('admin_token', result.data.token)
      router.push('/admin')
    } else {
      error.value = result.msg || '登录失败'
    }
  } catch (err) {
    console.error('登录请求异常:', err)
    error.value = '网络错误，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <div class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
          <Lock class="h-8 w-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-800">管理后台</h1>
        <p class="mt-1 text-sm text-gray-500">请输入管理密码以继续</p>
      </div>

      <div class="rounded-2xl bg-white p-6 shadow-sm">
        <form @submit.prevent="handleLogin">
          <div class="mb-4">
            <label class="mb-1.5 block text-sm font-medium text-gray-700">管理密码</label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入管理密码"
                class="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                @keyup.enter="handleLogin"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div v-if="error" class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {{ error }}
          </div>

          <Button
            type="submit"
            class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
            :disabled="loading"
          >
            <LogIn v-if="!loading" class="h-4 w-4" />
            <svg v-else class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ loading ? '验证中...' : '登录' }}
          </Button>
        </form>
      </div>

      <div class="mt-6 text-center">
        <router-link to="/" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500">
          <ArrowLeft class="h-3.5 w-3.5" />
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>
