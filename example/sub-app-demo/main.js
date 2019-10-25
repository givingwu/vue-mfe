import { createSubApp } from '../../src'
import routes from './routes'

export default createSubApp({
  prefix: '/demo',
  name: 'Demo ~~',
  routes,
  components: {
    Example: () => import('./components/example.vue')
  }
})
