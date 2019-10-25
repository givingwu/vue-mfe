import VueMfe from '../../../src'

export default VueMfe.createSubApp({
  prefix: '/lazy',
  name: 'Lazy Example',
  routes: [
    {
      path: '/lazy',
      component: () => import('./views/lazy.vue'),
      children: [
        {
          path: 'component',
          component: () => import('./views/async.vue')
        }
      ]
    }
  ]
})
