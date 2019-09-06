import { createSubApp } from '../src'

export default createSubApp({
  prefix: 'test',
  routes: [
    {
      path: '/test',
      component: {
        render() {
          return <div>Test Demo</div>
        },
      },
    },
  ],
  init(app) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true)
        console.log(app)
      }, 3e3)
    })
  },
})
