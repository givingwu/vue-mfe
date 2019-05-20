import mfe from './mfe'

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
