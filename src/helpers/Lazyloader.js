import { isDev, isObject, isArray, getLogger, getWarning, serialExecute, isFunction } from '../utils';
import { lazyloadStyle, lazyLoadScript } from '../utils/dom'

/**
 * @class Lazyloader
 * @description only focus on load resource from `config.getResource()`.
 */
export default class Lazyloader {
  static log () {
    return getLogger('VueMfe.' + Lazyloader.name)(arguments)
  }

  static warn() {
    return getWarning('VueMfe.' + Lazyloader.name)(arguments)
  }

  constructor() {
    this.cached = {}
  }

  load({ name }) {
    return this.getRouteEntry(name)
      .then((url) => {
        const globalVarName = this.getName(name)
        const resource = isFunction(url) ? url() : url
        Lazyloader.log('resource: ', resource);

        return isDev && isObject(resource) && !isArray(resource)
          ? resource /* if local import('url') */
          : this.installResources(resource, globalVarName)
      })
  }

  getRouteEntry (name) {
    let cache = this.cached[name]

    if (cache) {
      return Promise.resolve(cache)
    } else {
      return Promise.resolve(this.getResource(name))
        .then((data = {}) => {
          // merge cached with data
          this.cached = Object.assign({}, this.cached, data)

          if (data[name]) {
            return data[name]
          } else {
            Lazyloader.log('resources object', JSON.stringify(data))
            Lazyloader.warn(
              `The '${name}' cannot be found in 'config.getResource()'`
            )
          }
        })
    }
  }

  /**
   * installResources
   * @description install JS/CSS resources
   * @param {Array<URL> | URL} urls
   * @param {string} name
   */
  installResources (urls, name) {
    const allCss = urls.filter((url) => url.endsWith('.css'))
    const scripts = urls.filter((url) => url.endsWith('.js'))

    if (isArray(allCss) && allCss.length) {
      Promise.all(allCss.map((css) => lazyloadStyle(css))).catch((error) => Lazyloader.warn(error))
    }

    if (isArray(scripts) && scripts.length) {
      return serialExecute(
        scripts.map(script => lazyLoadScript(script, name))
      ).catch(function (error) {
        throw error
      })
    }
  }

  getResource(name) {
    return this.getConfig(name).getResource()
  }

  getName(name) {
    return this.getConfig(name).getNamespace(name)
  }

  getConfig(name = '*') {
    return this.configs[name] || this.configs['*']
  }

  setConfig(name, config) {
    if (isObject(name)) {
      config = name
      name = '*'
    }

    if (!this.configs) {
      this.configs = {}
    }

    this.configs[name] = config

    return this
  }
}
