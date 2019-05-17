import VueMfe from './index'

VueMfe.install = install

let _Vue

function install(Vue, opts = {}) {
  if (install.installed && _Vue === Vue) return
  install.installed = true
  _Vue = Vue

  /* inject to prototype object  */
  Object.defineProperty(Vue.prototype, '$mfe', {
    get() {
      return new VueMfe(opts)
    },
  })
}

if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue)
}

export { install }
export default VueMfe
