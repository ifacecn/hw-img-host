import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

console.log('main.ts 开始执行')
console.log('当前URL:', window.location.href)
console.log('import.meta.env:', import.meta.env)

try {
  const app = createApp(App)
  
  console.log('Vue应用创建成功')
  
  // 添加错误处理
  app.config.errorHandler = (err, vm, info) => {
    console.error('Vue应用错误:', err)
    console.error('错误组件:', vm)
    console.error('错误信息:', info)
    
    // 显示错误信息
    const errorDiv = document.createElement('div')
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ef4444;color:white;padding:12px;z-index:99999;font-family:monospace;'
    errorDiv.innerHTML = `
      <strong>Vue应用错误:</strong> ${err instanceof Error ? err.message : String(err)}
      <button onclick="this.parentElement.remove()" style="float:right;background:white;color:#ef4444;border:none;padding:2px 8px;margin-left:10px;cursor:pointer;">×</button>
    `
    document.body.appendChild(errorDiv)
  }
  
  app.use(router)
  console.log('路由已注册')
  
  app.mount('#app')
  console.log('应用挂载完成')
  
  // 隐藏加载动画
  setTimeout(() => {
    const loading = document.querySelector('.loading')
    if (loading) {
      loading.style.display = 'none'
      console.log('加载动画已隐藏')
    }
  }, 500)
  
} catch (error) {
  console.error('应用初始化失败:', error)
  
  const loading = document.querySelector('.loading')
  if (loading) {
    loading.innerHTML = `
      <div class="loading-error">
        <h3>应用初始化失败</h3>
        <p>${error instanceof Error ? error.message : String(error)}</p>
        <p><small>请检查控制台错误信息</small></p>
        <button onclick="location.reload()" style="margin-top:10px; padding:8px 16px; background:white; color:#ef4444; border:none; border-radius:4px; cursor:pointer;">
          刷新页面
        </button>
      </div>
    `
  }
}
