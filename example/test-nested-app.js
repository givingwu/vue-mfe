import { createSubApp } from '../src'

export default createSubApp({
  prefix: 'nest',
  parentPath: '/a',
  routes: [
    {
      path: '/nest',
      component: {
        render() {
          return <div>Test Demo</div>
        },
      },
    },
  ],
  init(app) {
    console.log(app)
  },
})
