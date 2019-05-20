<p align="center"><a href="https://vuchan.github.io/vue-mfe" target="_blank" rel="noopener noreferrer"><img width="100" src="./docs/.vuepress/public/images/mfe-logo.png" alt="VueMfe logo"></a></p>

<p align="center">
  <a href="https://npmcharts.com/compare/vue-mfe?minimal=true"><img src="https://img.shields.io/npm/dm/vue-mfe.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/vue-mfe"><img src="https://img.shields.io/npm/v/vue-mfe.svg" alt="Version"></a>
  <a href="https://github.com/996icu/996.ICU/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-Anti%20996-blue.svg" alt="License"></a>
  <br>
</p>


# VueMfe

✨ A JavaScript library for Vue.js micro front-end solution.

```bash
___________
| | |__ |__
| | |   |__
```


## FEATURES
+ integrating event-driven design pattern.
+ support preinstall or lazyload a micro-app.
+ enhanced vue-router with `helpers` property, [more](./src/helpers/EnhancedRouter.js).
+ support dynamically add child routes to an existing route & nested route.


## API

`mfe.js` use VueMfe as a Vue plugin and initialization it with config options:
```js
import Vue from 'vue'
import VueMfe from 'vue-mfe';
import router from './router';

Vue.use(VueMfe)

export default new VueMfe({
  router,
  ignoreCase: true, // ignore path case to make path '/AuTh/uSEr' has same result with path '/auth/user'
  parentPath: '/', // By default, dynamic routes are registered to children of this route.
  getNamespace: (name) => `__domain__app__${name}`, // a function to returns the global namespace by specific rule
  getResource: () => {
    if (process.env.NODE_ENV === 'development') {
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
```

`preinstall.js` preinstall a micro-app with name:
```js
import mfe from './mfe'

if (!mfe.isInstalled('foo')) {
  mfe.preinstall('foo').then(() => {
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
```

`main.js` initialize an app with VueMfe instance:
```js
import Vue from 'vue'
import VueMfe from 'vue-mfe'
import router from './router'
import mfe from './mfe'
import './preinstall'

new Vue({
  mfe,
  router,
  created() {
    // event: when load micro-app start
    this.$mfe.on('start', ({ name }) => {
      console.log(`Load ${name} start`);
    });

    // event: when load micro-app success
    this.$mfe.on('end', ({ name }) => {
      console.log(`Load ${name} success`);
    });

    // event: when load micro-app failed with diff error code
    this.$mfe.on('error', (error, { name }) => {
      console.log(name, error.code, VueMfe.ERROR_CODE);
      console.error(error);
    });
  },
  template: `
    <div id="app">
      <h1>Vue-MFE</h1>
      <router-view></router-view>
    </div>
  `
}).$mount('#app')
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
+ [ ] publish package to npm registry


## Troubleshooting

> This needs to be changed if multiple webpack runtimes (from different compilation) are used on the same webpage. Does anyone know how to resolve it?

  + [Multiple Webpack entry points loaded](https://github.com/webpack/webpack/issues/2112)
  + [Dynamic require breaks when using more than one webpack bundle at the same time] (https://github.com/webpack/webpack/issues/3791)
  + [在同一个页面中加载多个 webpack 实例](https://github.com/zh-rocco/fe-notes/issues/1)
  + [How can I combine two completely separate bundles using dynamic bundling?](https://stackoverflow.com/questions/42450048/webpack-how-can-i-combine-two-completely-separate-bundles-using-dynamic-bundlin)
  + [hosting-multiple-react-applications-on-the-same-document](https://medium.jonasbandi.net/hosting-multiple-react-applications-on-the-same-document-c887df1a1fcd)
