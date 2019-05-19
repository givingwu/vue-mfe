import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

export default new VueRouter({
  mode: 'hash',
  routes: [
    {
      path: '/',
      name: 'home',
      component: {
        template: '<div>This is Home<div><router-view></router-view></div></div>'
      }
    },
  ]
})
