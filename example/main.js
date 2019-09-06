import Vue from 'vue'
import App from './App'
import { createApp } from '../src'
import { LOAD_ERROR, LOAD_SUCCESS } from '../src/constants/EVENT_TYPE'
import VueRouter from 'vue-router'
Vue.use(VueRouter)

const router = new VueRouter({
  routes: [
    {
      path: '/',
      component: {
        render() {
          return (
            <div>
              <h1>Hello, Vue-Mfe!</h1>
              <ul>
                <li>
                  <router-link to={{ path: '/' }}>/</router-link>
                </li>
                <li>
                  <router-link to={{ path: '/a' }}>/a</router-link>
                </li>
                <li>
                  <router-link to={{ path: '/test' }}>
                    Async Test SubApp
                  </router-link>
                </li>
                <li>
                  <router-link to={{ path: '/a/nest' }}>
                    Async Nested SubApp
                  </router-link>
                </li>
                <li>
                  <router-link to={{ path: '/lazy' }}>Sync Lazy</router-link>
                </li>
              </ul>
              <router-view></router-view>
            </div>
          )
        },
      },
    },
    {
      path: '/a',
      component: {
        render() {
          return (
            <div>
              <h2>A</h2>
              <router-view></router-view>
            </div>
          )
        },
      },
    },
  ],
})

createApp({
  router,
  resources: () => ({
    lazy,
    test: () => import('./test-sub-app'),
    nest: () => import('./test-nested-app'),
  }),
})

const lazy = {
  path: '/lazy',
  component: {
    render() {
      return <h2>Are we all lazy?</h2>
    },
  },
}

const root = new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app')

root.$on(LOAD_SUCCESS, () => {
  console.log('router: ', router)
})

root.$on(LOAD_ERROR, (error) => {
  console.error('error: ', error)
})
