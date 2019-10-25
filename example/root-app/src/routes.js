export default [
  {
    path: '/',
    component: () => import('./layouts/default-container.vue'),
    children: [
      {
        path: '',
        component: () => import('./views/Index.vue')
      }
    ]
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
      }
    }
  }
]
