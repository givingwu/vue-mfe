const Bar = { template: '<div>This is Bar and id {{ $route.params.id }},  to <router-link to="/foo/bar">/foo/bar</router-link></div>' }
const FooBar = { template: '<p>This is FooBar</p>' };

const routes = [
  { path: '/bar', parentPath: '/foo', name: 'foo.bar', component: FooBar },
  { path: '/bar/:id', name: 'bar', component: Bar },
]

export default async () => {
  try {
    if (Math.random() > 0.5) {
      return await routes;
    } else {
      throw new Error('The `Math.random()` is less than 0.5 so initialize bar app failed');
    }
  } catch (e) {
    throw e;
  }
};

