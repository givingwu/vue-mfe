import Vue from 'vue'
import VueMfe from 'vue-mfe';
import router from './router';

Vue.use(VueMfe)

// eslint-disable-next-line
export default new VueMfe({
  router,
  ignoreCase: true,
  parentPath: '/',
  getNamespace: (name) => `__domain__app__${name}`,
  getResource: () => ({
    bar: () => import('../../../pure/domain-app/bar/esm'),
    foo: () => import('../../../pure/domain-app/foo/esm')
  })
});
