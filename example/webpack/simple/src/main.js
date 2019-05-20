import Vue from 'vue'
import VueMfe from 'vue-mfe'
import router from './router'
import mfe from './mfe'
import './preinstall'

new Vue({
  mfe,
  router,
  created() {
    // eslint-disable-next-line
    console.log(this.$mfe);

    // load start
    mfe.on('start', ({ name }) => {
      // eslint-disable-next-line no-console
      console.log(`Load ${name} start`);
    });

    // load success
    mfe.on('end', ({ name }) => {
      // eslint-disable-next-line no-console
      console.log(`Load ${name} success`);
    });

    // load error
    mfe.on('error', (error, { name }) => {
      // eslint-disable-next-line no-console
      console.log(error.code, VueMfe.ERROR_CODE);
      // eslint-disable-next-line no-console
      console.error(error, name);
    });
  },
  methods: {
    addDynamicRoute() {
      mfe.addRoutes([{
        path: '/dynamic',
        component: {
          template: '<h2>i am /dynamic page</h2>'
        }
      }], '/')
    }
  },
  template: `
    <div id="app">
      <h1>Vue-MFE Demo</h1>
      <p>Current route name: {{ $route.name }}</p>
      <ul>
        <li><router-link :to="{ name: 'home' }">home</router-link></li>
        <li><router-link :to="{ path: '/foo' }">preinstalled domain-app foo</router-link></li>
        <li><router-link :to="{ path: '/bar/123' }">lazyload domain-app bar with initialize function</router-link></li>
      </ul>
      <router-view class="view"></router-view>

      <div>
        <p>Go to path <router-link :to="{ path: '/foo/dynamic' }">/foo/dynamic</router-link></p>
        <p>
          The path <router-link :to="{ path: '/dynamic' }">/dynamic</router-link> does not exist in current router.
          click to <button @click="addDynamicRoute">Dynamically add child routes to an existing path '/'</button>,
          go to <router-link :to="{ path: '/dynamic' }">/dynamic</router-link>.
        </p>
      </div>
    </div>
  `
}).$mount('#app')
