window.__domain__app__bar = (function() {
  const Bar = { template: '<div>This is Bar {{ $route.params.id }}</div>' }
  const routes = [{ path: '/bar/:id', parentPath: '', name: 'bar', component: Bar }]

  return routes
}())