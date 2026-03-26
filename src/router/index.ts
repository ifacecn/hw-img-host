import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
    },
    {
      path: '/debug',
      name: 'debug',
      component: () => import('../views/DebugView.vue'),
    },
  ],
})

// 管理页面路由守卫（带调试日志）
router.beforeEach((to, from, next) => {
  console.log(`🛡️ 路由守卫: ${from.path} -> ${to.path}`)
  const token = sessionStorage.getItem('admin_token')
  console.log(`🔑 sessionStorage token:`, token ? '存在' : '不存在')
  
  if (to.name === 'admin' && !token) {
    console.log('⛔ 无权限访问管理页，跳转到登录页')
    next('/login')
  } else if (to.name === 'login' && token) {
    console.log('✅ 已登录，自动跳转到管理页')
    next('/admin')
  } else {
    console.log('✅ 允许访问')
    next()
  }
})

export default router
