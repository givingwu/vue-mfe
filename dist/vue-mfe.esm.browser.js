/*!
  * vue-mfe v1.0.0
  * (c) 2019 Vuchan
  * @license MIT
  */
import VueRouter from 'vue-router';

const isDev = "development" === 'development';

const noop = () => {};

const isArray = (arr) => Array.isArray(arr);

const isFunction = (fn) => fn && typeof fn === 'function';

const isObject = (obj) => obj && typeof obj === 'object';

const isString = (str) => typeof str === 'string';

const toArray = (args) => Array.prototype.slice.call(args);

const hasConsole =
  // eslint-disable-next-line
  typeof console !== 'undefined' && typeof console.warn === 'function';

function assert(condition, onSuccess, onFailure) {
  if (condition) {
    return isFunction(onSuccess) && onSuccess()
  } else {
    return isFunction(onFailure) && onFailure()
  }
}

const getLogger = (key) => (args) => {
  return assert(
    isDev,
    // eslint-disable-next-line
    () => hasConsole && console.log.apply(null, key ? [key, ...toArray(args)] : args),
    noop
  )
};

const getWarning = (key) => (args) => {
  const throwError = (err) => {
    throw new Error(err)
  };

  // eslint-disable-next-line
  const fn = isDev ? throwError : hasConsole ? console.warn : noop;

  return assert(true, () => {
    fn.apply(null, key ? [[key, ...toArray(args)].join(' > ')] : args);
  })
};

/**
 * @description resolve module whether ES Module or CommandJS module
 * @param {Module} module
 * @returns {any*}
 */
const resolveModule = (module) => ((module && module.default) || module);

/**
 * @description execute an array of promises serially
 * @param {Array<Promise<T>>} promises
 * @returns {Promise<T>} the finally result of promises
 */
const serialExecute = (promises) => {
  return promises.reduce((chain, next) => {
    return chain
      .then((retVal) => next(retVal))
      .catch((err) => {
        throw err
      })
  }, Promise.resolve())
};

/**
 * @class Observer
 * @author VuChan
 * @constructor
 * @see https://github.com/vuchan/fe-utils/blob/master/helpers/Obersver.js
 * @return {Object} Observer Design Pattern Implementation
 */
function Observer() {
  this.events = {};
}

/**
 * observer.on('eventName', function listener() {})
 * @param  {string} eventName
 * @param  {Function} listener
 * @return {Array<Function>}
 */
Observer.prototype.on = function(eventName, listener) {
  if (!this.events[eventName]) {
    this.events[eventName] = [ listener ];
  } else {
    this.events[eventName].push(listener);
  }

  return this.events[eventName];
};

/**
 * observer.off('eventName', function listener() {})
 * @param  {string} eventName
 * @param  {Function} listener
 * @return {boolean|null}
 */
Observer.prototype.off = function(eventName, listener) {
  if (eventName) {
    let handlers = this.events[eventName];

    if (handlers && handlers.length) {
      if (listener) {
        return (handlers = handlers.filter((handler) => handler === listener));
      } else {
        delete this.events[eventName];
        return true;
      }
    }
  } else {
    this.events = {};
  }
};

/**
 * observer.emit('eventName', data1, data2, ...dataN)
 * @param  {string} eventName
 * @param  {Array}  data
 * @return {boolean}
 */
Observer.prototype.emit = function(eventName, ...data) {
  const handlers = this.events[eventName];

  if (handlers) {
    handlers.forEach((handler) => handler.apply(null, data));
    return true;
  }
};

/**
 * @description lazy load style form a remote url then returns a promise
 * @param {String} url remote-url
 * @param {String} globalVar global variable key
 * @return {Promise}
 */
function lazyloadStyle(url) {
  const link = document.createElement('link');

  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.charset = 'utf-8';
  link.href = url;
  link.setAttribute('force', false);

  return new Promise((resolve, reject) => {
    let timerId = setTimeout(() => clearState(true), 1.2e4);

    function clearState(isError) {
      clearTimeout(timerId);
      link.onerror = link.onload = link.onreadystatechange = null; // 同时检查两种状态，只要有一种触发就删除事件处理器，避免触发两次

      isError && link && link.remove();
    }

    link.onload = function() {
      clearState();
      resolve(...arguments);
    };

    link.onerror = function() {
      clearState(true);
      reject(...arguments);
    };

    document.head.appendChild(link);
  })
}

/**
 * @description lazy load script form a remote url then returns a promise
 * @param {String} url remote-url
 * @param {String} globalVar global variable key
 * @return {Promise}
 */
function lazyLoadScript(url, globalVar) {
  const script = document.createElement('script');

  script.type = 'text/javascript';
  script.charset = 'utf-8';
  script.src = url;
  script.async = true;
  script.setAttribute('nonce', 'nonce');

  return new Promise((resolve, reject) => {
    let timerId = setTimeout(
      () => onLoadFailed(`Reject script ${url}: LOAD_SCRIPT_TIMEOUT`),
      1.2e4
    );

    function clearState() {
      clearTimeout(timerId);
      script.onerror = script.onload = script.onreadystatechange = null; // 同时检查两种状态，只要有一种触发就删除事件处理器，避免触发两次
      script.remove();
    }

    function onLoadSuccess() {
      clearState();
      resolve(globalVar ? window[globalVar] : undefined, ...arguments);
    }

    function onLoadFailed() {
      clearState();
      reject(...arguments);
    }

    if (script.readyState !== undefined) {
      // IE
      script.onreadystatechange = function change(evt) {
        if (
          (script.readyState === 'loaded' ||
            script.readyState === 'complete') &&
          (globalVar ? window[globalVar] : true)
        ) {
          onLoadSuccess();
        } else {
          onLoadFailed('Unknown error happened', evt);
        }
      };
    } else {
      // Others
      script.onload = onLoadSuccess;
      script.onerror = function error(evt) {
        onLoadFailed(`GET ${url} net::ERR_CONNECTION_REFUSED`, evt);
      };
    }

    document.body.appendChild(script);
  })
}

/**
 * @class Lazyloader
 * @description only focus on load resource from `config.getResource()`.
 */
class Lazyloader {
  static log () {
    return getLogger('VueMfe.' + Lazyloader.name)(arguments)
  }

  static warn() {
    return getWarning('VueMfe.' + Lazyloader.name)(arguments)
  }

  constructor() {
    this.cached = {};
  }

  load({ name }) {
    return this.getRouteEntry(name)
      .then((url) => {
        const resource = isFunction(url) ? url() : url;
        Lazyloader.log('getRouteEntry resource', resource);

        return isDev && isObject(resource) && !isArray(resource)
          ? resource /* if local import('url') */
          : this.installResources(isArray(resource) ? resource : [resource], this.getName(name))
      })
  }

  getRouteEntry (name) {
    let cache = this.cached[name];

    if (cache) {
      return Promise.resolve(cache)
    } else {
      return Promise.resolve(this.getResource(name))
        .then((data = {}) => {
          // merge cached with data
          this.cached = Object.assign({}, this.cached, data);

          if (data[name]) {
            return data[name]
          } else {
            Lazyloader.log('resources object', JSON.stringify(data));
            Lazyloader.warn(
              `The '${name}' cannot be found in 'config.getResource()'`
            );
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
    const allCss = urls.filter((url) => url.endsWith('.css'));
    const scripts = urls.filter((url) => url.endsWith('.js'));

    if (isArray(allCss) && allCss.length) {
      Promise.all(allCss.map((css) => lazyloadStyle(css))).catch((error) => Lazyloader.warn(error));
    }

    if (isArray(scripts) && scripts.length) {
      return serialExecute(
        scripts.map((script) => () => lazyLoadScript(script, name))
      ).catch((error) => {
        throw error
      })
    } else {
      Lazyloader.warn(`no any valid entry script be found in ${urls}`);
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
      config = name;
      name = '*';
    }

    if (!this.configs) {
      this.configs = {};
    }

    this.configs[name] = config;

    return this
  }
}

/**
 * findRoute 深度优先递归遍历找到匹配 matchPath 的 Route
 * @param {Array<Route>} routes
 * @param {String} matchPath
 * @returns {Object<Route>}
 */
function findRoute(routes = [], matchPath) {
  let i = 0;
  let matchedRoute = null;
  const l = routes.length;

  while (i < l) {
    const route = routes[i];
    const { path, children } = route;

    if (path === matchPath) {
      /* 匹配路径 */
      return route
    } else if (children && children.length) {
      /* 深度优先遍历，不匹配，但是有children，则递归children并返回匹配结果 */
      matchedRoute = findRoute(children, matchPath);
      i++; /* 自增当前集合索引i */
    } else {
      i++; /* 自增当前集合索引i */
    }

    if (matchedRoute) {
      return matchedRoute
    }
  }
}

/**
 * @description auto complete path with parent path
 * @param {String} path
 * @param {String} parentPath
 * @returns {String}
 */
function completePath(path, parentPath) {
  if (parentPath === '/' && path !== '/' && path.startsWith('/')) {
    return ensurePathSlash(path)
  } else {
    return ensurePathSlash(parentPath) + ensurePathSlash(path)
  }
}

function ensurePathSlash(path) {
  const trailingSlashRE = /\/?$/;
  path = path !== '/' ? path.replace(trailingSlashRE, '') : path;

  return path ? (ensureSlash(path) ? path : '/' + path) : '/'
}

function ensureSlash(path) {
  return path.charAt(0) === '/'
}

/**
 * @class EnhancedRouter
 * @description Dynamically add child routes to an existing route & provides some `helpers` method
 */
class EnhancedRouter {
  static warn() {
    return getWarning(EnhancedRouter.name)(arguments)
  }

  constructor(router) {
    if (router.addRoutes !== this.addRoutes) {
      router.addRoutes = this.addRoutes;
    }

    this.router = router;
    this.routes = router.options.routes;
    this.pathMap = {};
    this.pathList = [];

    this._init();
  }

  _init() {
    this.refreshAndCheckState(this.routes);
  }

  /**
   * @description Add new routes into current router, and supports dynamic nest
   * @see
   *  + [Dynamically add child routes to an existing route](https://github.com/vuejs/vue-router/issues/1156)
   *  + [Feature request: replace routes dynamically](https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465)
   * @param {Array<Route>} routes VueRoute route option
   * @param {?String} parentPath
   */
  addRoutes(routes, parentPath) {
    this.refreshAndCheckState(routes, parentPath);
    this.router.matcher = new VueRouter(
      this.normalizeOptions(this.router.options, { routes }, parentPath)
    ).matcher;
  }

  /**
   * @description normalize the options between oldRouter and newRouter with diff config options
   * @param {Object} oldOpts oldRouter VueRouter configuration options
   * @param {Object} newOpts newROuter VueRouter configuration options
   * @param {?String} parentPath
   * @returns {Object}
   */
  normalizeOptions(oldOpts, newOpts, parentPath) {
    const { routes: oldRoutes, ...oldProps } = oldOpts;
    const { routes: newRoutes, ...newProps } = newOpts;

    return Object.assign(
      {
        routes: this.mergeRoutes(oldRoutes, newRoutes, parentPath),
      },
      newProps,
      oldProps
    )
  }

  /**
   * @description before merge new routes we need to check it out does its path or name duplicate in old routes
   * @param {Array<Route>} oldRoutes
   * @param {Array<Route>} newRoutes
   * @param {?String} parentPath
   * @returns {Array<Route>} oldRoutes
   */
  mergeRoutes(oldRoutes, newRoutes, parentPath) {
    const needMatchPath = parentPath;

    newRoutes.forEach(route => {
      if (isString(route.parentPath)) {
        parentPath = route.parentPath;
        delete route.parentPath;
      } else {
        parentPath = needMatchPath;
      }

      if (isString(parentPath)) {
        if (parentPath === '') {
          oldRoutes.push(route);
        } else {
          const oldRoute = findRoute(oldRoutes, parentPath);
          let path = route.path;

          if (oldRoute) {
            (oldRoute.children || (oldRoute.children = [])).push(
              Object.assign({}, route, {
                path: (
                  parentPath && path.startsWith('/')
                    ? path = path.replace(/^\/*/, '')
                    : path
                ) /* fix: @issue that nested paths that start with `/` will be treated as a root path */,
              }));
          }
        }
      } else {
        oldRoutes.push(route);
      }
    });

    return oldRoutes
  }

  /**
   * @description 递归刷新路径 pathList 和 pathMap 并检查路由 path 和 name 是否重复
   * @param {Array<Route>} newRoutes
   * @param {String} parentPath
   *  1. from method calls: addRoutes(routes, parentPath)
   *  2. from route property: { path: '/bar', parentPath: '/foo', template: '<a href="/foo/bar">/foo/bar</a>' }
   */
  refreshAndCheckState(routes, parentPath) {
    routes.forEach(({ path, parentPath: selfParentPath, name, children }) => {
      /* 优先匹配 route self parentPath */
      if (selfParentPath) {
        path = this.getParentPath(path, selfParentPath, name);
      } else if (parentPath) {
        path = this.getParentPath(path, parentPath, name);
      }

      if (path) {
        if (!this.pathExists(path)) {
          this.pathList.push(path);
        } else {
          EnhancedRouter.warn(`The path ${path} in pathList has been existed`);
        }
      }

      if (name) {
        if (!this.nameExists(name)) {
          this.pathMap[name] = path;
        } else {
          EnhancedRouter.warn(`The name ${name} in pathMap has been existed`);
        }
      }

      if (children && children.length) {
        return this.refreshAndCheckState(children, path)
      }
    });
  }

  getParentPath(path, parentPath, name) {
    if (this.pathExists(parentPath)) {
      return path = completePath(path, parentPath)
    } else {
      EnhancedRouter.warn(`Cannot found the parent path ${parentPath} ${name ? 'of ' + name : ''} in Vue-MFE MasterRouter`);
      return ''
    }
  }

  pathExists(path) {
    return this.pathList.includes(path)
  }

  nameExists(name) {
    return this.pathMap[name]
  }

  findRoute(route) {
    let path = (isString(route) && route) || (isObject(route) && route.path);
    return path && findRoute(this.routes, path) || null
  }
}

let _Vue;

/**
 * @class VueMfe
 * @description Vue micro front-end Centralized Controller
 */
class VueMfe extends Observer  {
  static log() {
    return getLogger(VueMfe.name)(arguments)
  }

  static warn() {
    return getWarning(VueMfe.name)(arguments)
  }

  /**
   * @description To support a new Vue options `mfe` when Vue instantiation
   * see https://github.com/vuejs/vuex/blob/dev/src/mixin.js
   * @param {*} Vue
   */
  static install(Vue) {
    if (VueMfe.install.installed && _Vue === Vue) return
    VueMfe.install.installed = true;

    _Vue = Vue;

    const version = Number(Vue.version.split('.')[0]);

    if (version >= 2) {
      Vue.mixin({ beforeCreate: initVueMfe });
    } else {
      // override init and inject vuex init procedure
      // for 1.x backwards compatibility.
      const _init = Vue.prototype._init;
      Vue.prototype._init = function(options = {}) {
        options.init = options.init
          ? [initVueMfe].concat(options.init)
          : initVueMfe;
        _init.call(this, options);
      };
    }

    function initVueMfe() {
      const options = this.$options;
      // store injection
      if (options.mfe) {
        this.$mfe =
          typeof options.mfe === 'function' ? options.mfe() : options.mfe;
      } else if (options.parent && options.parent.$mfe) {
        this.$mfe = options.parent.$mfe;
      }
    }
  }

  constructor(opts = {}) {
    super();

    // Auto install if it is not done yet and `window` has `Vue`.
    // To allow users to avoid auto-installation in some cases,
    // this code should be placed here.
    if (
      /* eslint-disable-next-line no-undef */
      !Vue &&
      typeof window !== 'undefined' &&
      window.Vue &&
      !VueMfe.install.installed
    ) {
      VueMfe.install(window.Vue);
    }

    if (!opts || !opts.router || !(opts.router instanceof VueRouter)) {
      VueMfe.warn(
        'Must pass the router property in "Vue.use(VueMfe, { router, config })"'
      );
    }

    const { router, ...config } = opts;

    this.router = router;
    this.config = Object.assign({}, VueMfe.DEFAULTS, config);
    this.installedApps = {};

    this._init();
  }

  _init() {
    this.helpers = new EnhancedRouter(this.router);
    this.lazyloader = new Lazyloader().setConfig(this.config);

    this.router.beforeEach((to, from, next) => {
      if (
        to.matched.length === 0 ||
        this.router.match(to.path).matched.length === 0
      ) {
        const appName = this._getPrefixName(to);
        const args = { name: appName, to, from, next };

        if (this.isInstalled(appName)) {
          const error = new Error(
            `${appName} has been installed but it does not have path ${to.path}`
          );
          error.code = VueMfe.ERROR_CODE.LOAD_DUPLICATE_WITHOUT_PATH;

          this.emit('error', error, args);
        } else {
          this.installApp(args);
        }
      } else {
        next();
      }
    });
  }

  installApp(args) {
    const { name, next, to } = args;

    this.installedApps[name] = VueMfe.LOAD_STATUS.START;
    this.emit('start', args);

    return this.lazyloader
      .load(args)
      .then((module) => {
        VueMfe.log('installApp module', module);
        return this.installModule(module)
      })
      .then((success) => {
        VueMfe.log('installApp success', success);

        if (success) {
          this.installedApps[name] = VueMfe.LOAD_STATUS.SUCCESS;

          // After apply mini app routes, i must to force next(to)
          // instead of next(). next() do nothing... bug???
          next && to && next(to);
          this.emit('end', args);
        }
      })
      .catch((error) => {
        if (!(error instanceof Error)) error = new Error(error);
        if (!error.code) error.code = VueMfe.ERROR_CODE.LOAD_ERROR_HAPPENED;
        this.installedApps[name] = VueMfe.LOAD_STATUS.FAILED;

        next && next(false); // stop navigating to next route
        this.emit('error', error, args);
      })
  }

  /**
   * installModule
   * @description install ESM/UMD app module
   * @param {Module} module
   * @example
   *  1. module is a init function
   *    module: () => Promise<T>.then((routes: Array<Route> | boolean) => boolean)
   *  2. module is an array of routes
   *    module: Array<Route>
   *  3. module is an object with property 'init' and 'routes'
   *    module: { init: Function, routes: Array<Route> }
   */
  installModule(module) {
    module = resolveModule(module);

    const router = this.router;
    const app = router.app || {};

    // call init mini app (add routes mini app):
    if (module) {
      if (isFunction(module)) {
        // routes: () => Promise<T>.then((routes: Array<Route> | boolean) => boolean)
        return Promise.resolve(module(app)).then((routesOrBool) => {
          return this._checkRoutes(routesOrBool)
        })
      } else if (isArray(module)) {
        // module: Array<Route>
        return this.addRoutes(module)
      } else if (isObject(module)) {
        // module: { init: Promise<T>.then((success: boolean) => boolean), routes: Array<Route> }
        return (
          isFunction(module.init) &&
          Promise.resolve(module.init(app)).then((bool) => {
            return bool === false || bool instanceof Error
              ? this._checkRoutes(bool)
              : this.addRoutes(module.routes)
          })
        )
      }
    } else {
      return false
    }
  }

  addRoutes(routes, parentPath) {
    if (routes) {
      if (routes.length) {
        this.helpers.addRoutes(routes, parentPath || this.config.parentPath);

        return true
      } else {
        VueMfe.warn('Routes has no any valid item');
      }
    } else {
      VueMfe.warn(
        'Must pass a valid "routes: Array<Route>" in "addRoutes" method'
      );
    }

    return false
  }

  isInstalled(route) {
    let name = route;

    if (isObject(route) && /\//.exec(route.path)) {
      name = this._getPrefixName(route);
    } else if (isString(route) && /\//.exec(route)) {
      name = this._getPrefixNameByDelimiter(route, '/');
    }

    return this.installedApps[name] === VueMfe.LOAD_STATUS.SUCCESS
  }

  preinstall(name) {
    return name && this.installApp({ name })
  }

  /**
   * @description get the domain-app prefix name by current router and next route
   * @param {VueRouter} router
   * @param {VueRoute} next
   * @param {?Boolean} ignoreCase
   */
  _getPrefixName(route) {
    return route.name && route.name.includes('.')
      ? this._getPrefixNameByDelimiter(route.name, '.')
      : this._getPrefixNameByDelimiter(route.path, '/')
  }

  _getPrefixNameByDelimiter(str, delimiter) {
    return (
      (this.config.ignoreCase ? str.toLowerCase() : str)
        .split(delimiter)
        /* filter all params form router to get right name */
        .filter(
          (s) => !Object.values(this.router.currentRoute.params).includes(s)
        )
        .filter(Boolean)
        .map((s) => s.trim())
        .shift()
    )
  }

  _checkRoutes(routesOrBool) {
    if (routesOrBool) {
      return this.addRoutes(routesOrBool)
    } else {
      if (routesOrBool instanceof Error) {
        routesOrBool.code = VueMfe.ERROR_CODE.APP_INIT_FAILED;
        throw routesOrBool
      } else {
        VueMfe.warn('Module ' + name + ' initialize failed.');
      }
    }

    return false
  }
}

VueMfe.version = '1.0.0';
VueMfe.DEFAULTS = {
  ignoreCase: true,
  parentPath: null,
  getNamespace: (name) => `__domain__app__${name}`
};
VueMfe.LOAD_STATUS = {
  SUCCESS: 1,
  START: 0,
  FAILED: -1
};
VueMfe.ERROR_CODE = {
  LOAD_ERROR_HAPPENED: VueMfe.LOAD_STATUS.FAILED,
  LOAD_DUPLICATE_WITHOUT_PATH: -2,
  APP_INIT_FAILED: -3
};

export default VueMfe;
