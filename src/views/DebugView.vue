<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  console.log('Debug页面加载')
  console.log('当前路由:', router.currentRoute.value)
  
  // 测试路由跳转
  setTimeout(() => {
    console.log('3秒后测试跳转到首页...')
    router.push('/').then(() => {
      console.log('跳转成功')
    }).catch(err => {
      console.error('跳转失败:', err)
    })
  }, 3000)
})
</script>

<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">路由调试页面</h1>
    <div class="space-y-4">
      <button @click="router.push('/')" class="px-4 py-2 bg-blue-500 text-white rounded">
        跳转到首页
      </button>
      <button @click="router.push('/admin')" class="px-4 py-2 bg-green-500 text-white rounded">
        跳转到管理页
      </button>
      <button @click="router.push('/login')" class="px-4 py-2 bg-purple-500 text-white rounded">
        跳转到登录页
      </button>
    </div>
    <div class="mt-8 p-4 bg-gray-100 rounded">
      <h2 class="text-lg font-semibold mb-2">当前状态：</h2>
      <pre id="status"></pre>
    </div>
  </div>
</template>

<style>
pre {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>