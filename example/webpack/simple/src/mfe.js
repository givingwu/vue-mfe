import VueMfe from 'vue-mfe';
import router from './router';

// eslint-disable-next-line
const mfe = new VueMfe({
  router,
  ignoreCase: true,
  parentPath: '/',
  getNamespace: (name) => `__domain__app__${name}`,
  getResource: () => ({
    bar: () => import('../../../pure/domain-app/bar/esm'),
    foo: () => import('../../../pure/domain-app/foo/esm')
  })
});

// eslint-disable-next-line
console.log('VueMfe: ', mfe);

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

export default mfe