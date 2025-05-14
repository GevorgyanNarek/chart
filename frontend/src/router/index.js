import { createWebHistory , createRouter } from 'vue-router'


const routes = [
  { path: '/index', component: () => import('@/pages/IndexPage.vue') },
  { path: '/yield', component: () =>  import('@/pages/YieldPage.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router