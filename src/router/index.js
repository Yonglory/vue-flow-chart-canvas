import { createRouter, createWebHistory } from 'vue-router'
import FlowPage from '@/views/FlowPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'canvas',
      component: FlowPage,
    },
    {
      path: '/nodes/:nodeId',
      name: 'node',
      component: FlowPage,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
