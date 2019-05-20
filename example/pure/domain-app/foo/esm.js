const Foo = { template: '<div>This is Foo and to <router-link to="/foo/child">/foo/child</router-link> <router-view></router-view></div>' };
const FooChild = { template: '<div>This is a Child view in /foo</div>' };
const routes = [
  // eslint-disable-next-line
  { path: '/foo', parentPath: '', name: 'foo', component: Object.assign({ created() { console.log(this) } }, Foo) },
  { path: '/child', parentPath: '/foo', name: 'foo-child', component: FooChild }
];

export default routes
