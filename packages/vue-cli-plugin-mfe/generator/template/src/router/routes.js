export default [
  {
    path: '/<%= domainRoutePrefix %>', // 根路由 '/' => `/${namespace}`
    name: '<%= domainRoutePrefix %>.main', // 路由 name: name => `${namespace}.${name}`
    redirect: '/<%= domainRoutePrefix %>/a',
    component: {
      render() {
        return <router-view />
      },
    },
    children: [
      {
        path: 'a', // child path 一定不能以 '/' 开始,
        // Note that nested paths that start with `/` will be treated as a root path.
        // This allows you to leverage the component nesting without having to use a nested URL.
        name: '<%= domainRoutePrefix %>.pageA',
        meta: {
          name: '<%= domainRoutePrefix %> Page A',
        },
        /* https://medium.com/webpack/link-rel-prefetch-preload-in-webpack-51a52358f84c */
        component: () =>
          import(/* webpackPrefetch: true */ '../views/Home.vue'),
      },
      {
        path: 'b',
        name: '<%= domainRoutePrefix %>.pageB',
        meta: {
          name: '<%= domainRoutePrefix %> Page B', // 页面标题
          hideTitle: true, // 不显示页面标题
        },
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        /* https://medium.com/webpack/link-rel-prefetch-preload-in-webpack-51a52358f84c */
        component: () =>
          import(/* webpackPrefetch: true */ '../views/About.vue'),
      },
    ],
  },
]
