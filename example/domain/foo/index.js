window.__domain__app__foo = (function() {
  const Foo = { template: '<div>This is Foo</div>' }
  const routes = [{ path: '/foo',  parentPath: '', name: 'foo', component: Foo }]

  return function(app) {
    return new Promise((resolve, reject) => {
      if (Math.random() * 10 > 0.2) {
        resolve(routes)
      } else {
        const msg = 'initialize domain-app foo failed'
        alert(msg)
        reject(msg)
      }
    })
  }
}())