import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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

// 管理页面路由守卫
router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('admin_token')
  if (to.name === 'admin' && !token) {
    next('/login')
  } else if (to.name === 'login' && token) {
    next('/admin')
  } else {
    next()
  }
})

export default router
