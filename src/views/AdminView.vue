<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  LogOut,
  Trash2,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowLeft,
  Check,
  X,
} from 'lucide-vue-next'

const router = useRouter()

// 状态
const images = ref<any[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const searchKeyword = ref('')
const selectedImage = ref<string | null>(null)
const previewVisible = ref(false)
const deleteConfirm = ref<string | null>(null)
const copiedUrl = ref<string | null>(null)
const deleting = ref<string | null>(null)

// 计算总页数
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 获取 token
function getToken() {
  return sessionStorage.getItem('admin_token') || ''
}

// 格式化文件大小
function formatSize(bytes: number) {
  if (bytes === 0) return '未知'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i]
}

// 格式化时间
function formatTime(time: string) {
  if (!time) return '未知'
  try {
    const d = new Date(time)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return time
  }
}

// 过滤后的图片列表
const filteredImages = computed(() => {
  if (!searchKeyword.value.trim()) return images.value
  const kw = searchKeyword.value.toLowerCase()
  return images.value.filter((img) => img.name.toLowerCase().includes(kw))
})

// 获取图片列表
async function fetchImages() {
  loading.value = true
  try {
    const resp = await fetch(
      `/api/admin/images?page=${currentPage.value}&pageSize=${pageSize.value}`,
      {
        headers: { Authorization: `Bearer ${getToken()}` },
      },
    )
    const data = await resp.json()

    if (data.code === 0) {
      images.value = data.data.list
      total.value = data.data.total
    } else if (data.code === 1 && data.msg.includes('登录')) {
      sessionStorage.removeItem('admin_token')
      router.push('/login')
    } else {
      console.error('获取图片列表失败:', data.msg)
    }
  } catch (err) {
    console.error('获取图片列表失败:', err)
  } finally {
    loading.value = false
  }
}

// 删除图片
async function deleteImage(fileName: string) {
  if (deleting.value) return
  deleting.value = fileName

  try {
    const resp = await fetch('/api/admin/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ fileName }),
    })
    const data = await resp.json()

    if (data.code === 0) {
      deleteConfirm.value = null
      await fetchImages()
    } else {
      alert(data.msg || '删除失败')
    }
  } catch {
    alert('网络错误，删除失败')
  } finally {
    deleting.value = null
  }
}

// 复制链接
async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    copiedUrl.value = url
    setTimeout(() => {
      copiedUrl.value = null
    }, 2000)
  } catch {
    // fallback
    const input = document.createElement('input')
    input.value = url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copiedUrl.value = url
    setTimeout(() => {
      copiedUrl.value = null
    }, 2000)
  }
}

// 预览图片
function previewImage(url: string) {
  selectedImage.value = url
  previewVisible.value = true
}

// 退出登录
function logout() {
  sessionStorage.removeItem('admin_token')
  router.push('/')
}

// 翻页
function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchImages()
}

onMounted(() => {
  const token = getToken()
  if (!token) {
    router.push('/login')
    return
  }
  fetchImages()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div class="flex items-center gap-3">
          <router-link to="/" class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-500">
            <ArrowLeft class="h-4 w-4" />
            首页
          </router-link>
          <span class="text-gray-300">|</span>
          <h1 class="text-lg font-bold text-gray-800">
            <ImageIcon class="mr-1.5 inline h-5 w-5 text-blue-500" />
            图片管理
          </h1>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500">共 {{ total }} 张图片</span>
          <Button variant="outline" size="sm" @click="fetchImages" :disabled="loading">
            <RefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': loading }" />
            刷新
          </Button>
          <Button variant="ghost" size="sm" class="text-red-500 hover:bg-red-50 hover:text-red-600" @click="logout">
            <LogOut class="h-3.5 w-3.5" />
            退出
          </Button>
        </div>
      </div>
    </header>

    <!-- 搜索栏 -->
    <div class="mx-auto max-w-7xl px-4 pt-4">
      <div class="relative">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索文件名..."
          class="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
        />
      </div>
    </div>

    <!-- 图片列表 -->
    <div class="mx-auto max-w-7xl px-4 py-4">
      <!-- 加载状态 -->
      <div v-if="loading && images.length === 0" class="flex flex-col items-center justify-center py-20">
        <RefreshCw class="mb-4 h-8 w-8 animate-spin text-blue-500" />
        <p class="text-sm text-gray-500">加载中...</p>
      </div>

      <!-- 空状态 -->
      <div
        v-else-if="!loading && filteredImages.length === 0"
        class="flex flex-col items-center justify-center py-20"
      >
        <ImageIcon class="mb-4 h-12 w-12 text-gray-300" />
        <p class="text-sm text-gray-500">
          {{ searchKeyword ? '没有找到匹配的图片' : '暂无图片' }}
        </p>
      </div>

      <!-- 图片网格 -->
      <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <div
          v-for="img in filteredImages"
          :key="img.name"
          class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
        >
          <!-- 缩略图 -->
          <div
            class="relative aspect-square cursor-pointer overflow-hidden bg-gray-100"
            @click="previewImage(img.url)"
          >
            <img
              :src="img.url"
              :alt="img.name"
              class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <!-- 悬浮操作 -->
            <div
              class="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100"
            >
              <button
                class="rounded-lg bg-white/90 p-2 text-gray-700 shadow transition hover:bg-white"
                title="复制链接"
                @click.stop="copyUrl(img.url)"
              >
                <Copy v-if="copiedUrl !== img.url" class="h-4 w-4" />
                <Check v-else class="h-4 w-4 text-green-500" />
              </button>
              <button
                class="rounded-lg bg-white/90 p-2 text-gray-700 shadow transition hover:bg-white"
                title="新窗口打开"
                @click.stop="window.open(img.url, '_blank')"
              >
                <ExternalLink class="h-4 w-4" />
              </button>
              <button
                class="rounded-lg bg-red-500/90 p-2 text-white shadow transition hover:bg-red-600"
                title="删除"
                @click.stop="deleteConfirm = img.name"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>

          <!-- 文件信息 -->
          <div class="p-2.5">
            <p class="truncate text-xs font-medium text-gray-700" :title="img.name">{{ img.name }}</p>
            <div class="mt-1 flex items-center justify-between text-xs text-gray-400">
              <span>{{ formatSize(img.size) }}</span>
              <span>{{ formatTime(img.lastModified) }}</span>
            </div>
          </div>

          <!-- 删除确认 -->
          <div
            v-if="deleteConfirm === img.name"
            class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-white/95 backdrop-blur-sm"
          >
            <p class="text-sm font-medium text-gray-700">确定删除此图片？</p>
            <p class="max-w-[80%] truncate text-xs text-gray-400">{{ img.name }}</p>
            <div class="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                @click="deleteConfirm = null"
                :disabled="deleting === img.name"
              >
                <X class="h-3.5 w-3.5" />
                取消
              </Button>
              <Button
                size="sm"
                class="bg-red-500 text-white hover:bg-red-600"
                @click="deleteImage(img.name)"
                :disabled="deleting === img.name"
              >
                <Trash2 v-if="deleting !== img.name" class="h-3.5 w-3.5" />
                <svg v-else class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {{ deleting === img.name ? '删除中...' : '删除' }}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div
        v-if="totalPages > 1"
        class="mt-6 flex items-center justify-center gap-2"
      >
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage <= 1"
          @click="goToPage(currentPage - 1)"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>
        <template v-for="p in totalPages" :key="p">
          <Button
            v-if="p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)"
            :variant="p === currentPage ? 'default' : 'outline'"
            size="sm"
            @click="goToPage(p)"
          >
            {{ p }}
          </Button>
          <span
            v-else-if="p === currentPage - 3 || p === currentPage + 3"
            class="px-1 text-gray-400"
          >
            ...
          </span>
        </template>
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage >= totalPages"
          @click="goToPage(currentPage + 1)"
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <Teleport to="body">
      <div
        v-if="previewVisible"
        class="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4"
        @click="previewVisible = false"
      >
        <div class="relative max-h-[90vh] max-w-[90vw]" @click.stop>
          <button
            class="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-600 shadow-lg transition hover:bg-gray-100"
            @click="previewVisible = false"
          >
            <X class="h-4 w-4" />
          </button>
          <img
            :src="selectedImage"
            class="max-h-[85vh] rounded-lg object-contain shadow-2xl"
            @click.stop
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>
