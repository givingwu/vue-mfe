```bash
___________
| | |__ |__
| | |   |__
```

# VueMfe

✨ A JavaScript library for Vue.js micro front-end solution.


## FEATURES
+ integrating event-driven design pattern.
+ preinstall or lazyload a micro-app.
+ enhanced vue-router with `helpers` property, [more](./src/helpers/EnhancedRouter.js).
+ dynamically add child routes to an existing route & nested route.


## API

Master-runtime:
```js
// eslint-disable-next-line
const mfe = new VueMfe({
  router: new VueRouter({ routes: [] }),
  ignoreCase: true, // ignore path case to make path '/AuTh/uSEr' has same result with path '/auth/user'
  parentPath: '/', // By default, dynamic routes are registered to children of this route.
  getNamespace: (name) => `__domain__app__${name}`, // global namespace rule
  getResource: () => {
    if (process.env.NODE_ENV) {
      return {
        bar: () => import('../../../domain-app/bar/esm'),
        foo: () => import('../../../domain-app/foo/esm'),
      }
    } else {
      return {
        bar: ['http://absolute/path/to/bar.umd.js'],
        foo: ['http://absolute/path/to/foo.umd.js'],
      }
    }
  }
});

// pre install an app
if (!mfe.isInstalled('foo')) {
  mfe.preinstall('foo').then(() => {
    // eslint-disable-next-line
    console.log('isInstalled:', mfe.isInstalled('foo')); // true

    // does path exist or not
    if (mfe.helpers.pathExists('/foo')) {
      // eslint-disable-next-line
      console.log('/foo route:', mfe.helpers.findRoute('/foo')) /* findRoute(path: string) */

      if (!mfe.helpers.pathExists('/foo/dynamic')) {
        /* add route dynamic with parentPath and exists route */
        mfe.addRoutes([{
          path: '/dynamic',
          parentPath: '/foo',
          component: {
            template: '<h2>i am /foo/dynamic page</h2>'
          }
        }])
      }
    }
  })
}

// eslint-disable-next-line
console.log('VueMfe: ', mfe);

// load micro-app start
mfe.on('start', ({ name }) => {
  // eslint-disable-next-line no-console
  console.log(`Load ${name} start`);
});

// load micro-app success
mfe.on('end', ({ name }) => {
  // eslint-disable-next-line no-console
  console.log(`Load ${name} success`);
});

// load micro-app error
mfe.on('error', (error, { name }) => {
  // eslint-disable-next-line no-console
  console.log(error.code, VueMfe);
  // eslint-disable-next-line no-console
  console.error(error, name);
});
```


## DEMO
install all dependencies
```bash
npm install
```

demo with webpack
```bash
npm run example:webpack
```

pure demo
```bash
npm run example:pure
```


## TODO
+ [ ] write unit test cases
+ [ ] write demo with multiple webpack
+ [ ] update docs by vuepress


## Troubleshooting

> This needs to be changed if multiple webpack runtimes (from different compilation) are used on the same webpage. Does anyone know how to resolve it?

  + [Multiple Webpack entry points loaded](https://github.com/webpack/webpack/issues/2112)
  + [Dynamic require breaks when using more than one webpack bundle at the same time] (https://github.com/webpack/webpack/issues/3791)
  + [在同一个页面中加载多个 webpack 实例
](https://github.com/zh-rocco/fe-notes/issues/1)
  + [How can I combine two completely separate bundles using dynamic bundling?](https://stackoverflow.com/questions/42450048/webpack-how-can-i-combine-two-completely-separate-bundles-using-dynamic-bundlin)
  + [hosting-multiple-react-applications-on-the-same-document](https://medium.jonasbandi.net/hosting-multiple-react-applications-on-the-same-document-c887df1a1fcd)
