export default [
  {
    path: '/demo',
    component: () => import('./views/Demo.vue')
  },
  {
    path: '/demo/layout',
    // if you do not want this route be added into '/'
    // root view layout as child route
    // set the parentPath property to be a empty string ''
    parentPath: '',
    component: () => import('./views/SelfLayout.vue')
  }
]
