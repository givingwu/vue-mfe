import Vue from 'vue'
import App from './App'
import routes from './routes'
import { createApp } from '../../../src'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const router = new VueRouter({ routes })

// create the VueMfe pedestal(root) application
createApp({
  router,
  resources: () => ({
    // when route path stars with 'demo', so VueMfe will think it is demo sub-application
    demo: () => import('../../sub-app-demo/main'), // load from local
    lazy: () => import('../../sub-app-lazy/src/main') // load from remote
  })
})

new Vue({
  router,
  render: (h) => h(App)
}).$mount('#app')
