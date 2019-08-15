/*!
  * vue-mfe v1.0.4
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
    () =>
      hasConsole &&
      console.log.apply(null, key ? [key, ...toArray(args)] : args),
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
 * @template Module
 * @property {Object} [default]
 * @param {Module & Object} module
 * @returns {*}
 */
const resolveModule = (module) => (module && module.default) || module;

/**
 * @description execute an array of promises serially
 * @template T
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

      isError && link && remove(link);
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
      remove(script);
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
 * https://stackoverflow.com/questions/20428877/javascript-remove-doesnt-work-in-ie
 * IE doesn't support remove() native Javascript function but does support removeChild().
 * remove
 * @param {HTMLElement} ele
 */
function remove(ele) {
  if (ele && ele instanceof HTMLElement) {
    if (typeof ele.remove === 'function') {
      ele.remove();
    } else {
      ele.parentNode.removeChild(ele);
    }
  }
}

/**
 * @class Lazyloader
 * @description only focus on load resource from `config.getResource()`.
 */
class Lazyloader {
  static log() {
    return getLogger('VueMfe.' + Lazyloader.name)(arguments)
  }

  static warn() {
    return getWarning('VueMfe.' + Lazyloader.name)(arguments)
  }

  /**
   * @constructor
   */
  constructor() {
    /** @type {{}} */
    this.cached = {};
  }

  load({ name }) {
    return this.getRouteEntry(name).then((url) => {
      const resource = isFunction(url) ? url() : url;
      Lazyloader.log(`start to load ${name} resources:`, resource);

      return isDev && isObject(resource) && !isArray(resource)
        ? resource /* if local import('url') */
        : this.installResources(
            (isArray(resource) ? resource : [resource]).filter(Boolean),
            this.getName(name)
          )
    })
  }

  getRouteEntry(name) {
    let cache = this.cached[name];

    if (cache) {
      return Promise.resolve(cache)
    } else {
      return Promise.resolve(this.getResource(name)).then((data = {}) => {
        this.cached = Object.assign({}, this.cached, data);

        if (data[name]) {
          return data[name]
        } else {
          Lazyloader.log('all resources', JSON.stringify(data));
          Lazyloader.warn(
            `The App '${name}' cannot be found in method 'config.getResource()'`
          );
        }
      })
    }
  }

  /**
   * installResources
   * @description install JS/CSS resources
   * @typedef {string} Link
   * @param {Array<Link>} urls
   * @param {string} name
   */
  installResources(urls, name) {
    const allCss = urls.filter((url) => url.endsWith('.css'));
    const scripts = urls.filter((url) => url.endsWith('.js'));

    if (isArray(allCss) && allCss.length) {
      Promise.all(allCss.map((css) => lazyloadStyle(css))).catch((error) =>
        Lazyloader.warn(error)
      );
    }

    if (isArray(scripts) && scripts.length) {
      return serialExecute(
        // @ts-ignore
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
 * @typedef {import('vue-router').RouteConfig} Route
 * @param {Array<Route>} routes
 * @param {String} matchPath
 * @returns {Route}
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
 * @param {string} path
 * @param {string} parentPath
 * @returns {string}
 */
function completePath(path, parentPath) {
  if (parentPath === '/' && path !== '/' && path.startsWith('/')) {
    return ensurePathSlash(path)
  } else {
    return ensurePathSlash(parentPath) + ensurePathSlash(path)
  }
}

/**
 * ensurePathSlash
 * @param {string} path
 */
function ensurePathSlash(path) {
  const trailingSlashRE = /\/?$/;
  path = path !== '/' ? path.replace(trailingSlashRE, '') : path;

  return path ? (ensureSlash(path) ? path : '/' + path) : '/'
}

/**
 * ensureSlash
 * @param {string} path
 */
function ensureSlash(path) {
  return path.charAt(0) === '/'
}

// @ts-ignore

/**
 * @class EnhancedRouter
 * @description Dynamically add child routes to an existing route & provides some `helpers` method
 */
class EnhancedRouter {
  static warn() {
    return getWarning(EnhancedRouter.name)(arguments)
  }

  /**
   * @typedef {import('vue-router').RouteConfig} VueRoute
   * @typedef {Object} EnhancedRoute
   * @property {string} parentPath The nested parent path
   * @property {string|Array<string>} childrenApps The nested children app name or names array
   * @typedef {VueRoute & EnhancedRoute} Route
   *
   * @typedef {import('vue-router').default} VueRouter
   * @typedef {Object} EnhancedRouterRef
   * @property {import('vue-router').RouterOptions} options
   * @property {Object} matcher
   * @typedef {VueRouter & EnhancedRouterRef} Router
   *
   * @param {Router} router
   */
  constructor(router) {
    // @override `VueRouter.prototype.addRoutes` method
    if (router.addRoutes !== this.addRoutes) {
      router.addRoutes = this.addRoutes.bind(this);
    }

    this.router = router;

    /**
     * @type {Route[]}
     */
    // @ts-ignore
    this.routes = router.options.routes;
    this.pathMap = {};
    this.pathList = [];
    this.appsMap = {};

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
   * @param {Array<Route>} newRoutes VueRoute route option
   * @param {string} [parentPath]
   * @param {Array<Route>} [oldRoutes]
   */
  addRoutes(newRoutes, parentPath, oldRoutes) {
    if (isDev) {
      console.log(this.pathList);
      console.log(this.pathMap);
    }

    // before merge new routes we need to check them out does
    // any path or name whether duplicate in old routes
    this.refreshAndCheckState(newRoutes, parentPath);

    // reset current router's matcher with merged routes
    this.router.matcher = new VueRouter(
      this.normalizeOptions(
        // @ts-ignore
        this.adaptRouterOptions(oldRoutes || this.router),
        { routes: newRoutes },
        parentPath
      )
      // @ts-ignore
    ).matcher;
  }

  /**
   * @param {Route[]|Router} routesOrRouterOpts
   */
  adaptRouterOptions(routesOrRouterOpts) {
    if (routesOrRouterOpts) {
      if (routesOrRouterOpts instanceof VueRouter) {
        return routesOrRouterOpts.options
      } else if (isArray(routesOrRouterOpts)) {
        return { routes: routesOrRouterOpts }
      }
    }

    return {}
  }

  /**
   * @description normalize the options between oldRouter and newRouter with diff config options
   * @param {Router["options"]} oldOpts oldRouter
   * @param {Router["options"]} newOpts newROuter
   * @param {string} [parentPath]
   * @returns {Object}
   */
  normalizeOptions(oldOpts, newOpts, parentPath) {
    const { routes: oldRoutes = [], ...oldProps } = oldOpts;
    const { routes: newRoutes = [], ...newProps } = newOpts;

    return Object.assign(
      {
        routes: this.mergeRoutes(oldRoutes, newRoutes, parentPath)
      },
      newProps,
      oldProps
    )
  }

  /**
   * mergeRoutes
   * @param {Array<Route>} oldRoutes
   * @param {Array<Route>} newRoutes
   * @param {string} [parentPath]
   * @returns {Array<Route>} oldRoutes
   */
  mergeRoutes(oldRoutes, newRoutes, parentPath) {
    const needMatchPath = parentPath;

    newRoutes.forEach((route) => {
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
                path:
                  parentPath && path.startsWith('/')
                    ? (path = path.replace(/^\/*/, ''))
                    : path /* fix: @issue that nested paths that start with `/` will be treated as a root path */
              })
            );
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
   * @param {Array<Route>} routes
   * @param {String} [parentPath]
   *  1. from method calls: addRoutes(routes, parentPath)
   *  2. from route property: { path: '/bar', parentPath: '/foo', template: '<a href="/foo/bar">/foo/bar</a>' }
   */
  refreshAndCheckState(routes, parentPath) {
    routes.forEach(
      ({ path, parentPath: selfParentPath, name, children, childrenApps }) => {
        /* 优先匹配 route self parentPath */
        if (selfParentPath) {
          path = this.genParentPath(path, selfParentPath, name);
        } else if (parentPath) {
          path = this.genParentPath(path, parentPath, name);
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

        // if childrenApps exists so records it with its fullPath
        if (childrenApps) {
[].concat(childrenApps).forEach((app) => {
            if (typeof app === 'object') {
              const [appName, appPath] = Object.entries(app).shift();
              this.appsMap[completePath(appPath, path)] = appName;
            } else {
              this.appsMap[completePath(app, path)] = appName;
            }
          });
        }

        if (children && children.length) {
          return this.refreshAndCheckState(children, path)
        }
      }
    );
  }

  genParentPath(path, parentPath, name) {
    if (this.pathExists(parentPath)) {
      return (path = completePath(path, parentPath))
    } else {
      EnhancedRouter.warn(
        `Cannot found the parent path ${parentPath} ${
          name ? 'of ' + name : ''
        } in Vue-MFE MasterRouter`
      );
      return ''
    }
  }

  pathExists(path) {
    return this.pathList.includes(path)
  }

  nameExists(name) {
    return this.pathMap[name]
  }

  getChildrenApps(path) {
    const apps = this.appsMap[path];

    if (apps) {
      return [].concat(apps)
    }

    return null
  }

  findRoute(routes, route) {
    let path = (isString(route) && route) || (isObject(route) && route.path);
    return (path && findRoute(routes || this.routes, path)) || null
  }
}

let _Vue;

/**
 * @class VueMfe
 * @description Vue micro front-end Centralized Controller
 */
class VueMfe extends Observer {
  static log() {
    return getLogger(VueMfe.name)(arguments)
  }

  static warn() {
    return getWarning(VueMfe.name)(arguments)
  }

  /**
   * @description To support a new Vue options `mfe` when Vue instantiation
   * see https://github.com/vuejs/vuex/blob/dev/src/mixin.js
   * @param {import('vue').VueConstructor} Vue
   */
  static install(Vue) {
    // @ts-ignore
    if (VueMfe.install.installed && _Vue === Vue) return
    // @ts-ignore
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

  /**
   * @typedef {import('vue-router').RouteConfig} VueRoute
   * @typedef {Object} EnhancedRoute
   * @property {string} parentPath The nested parent path
   * @property {string|Array<string>} childrenApps The nested children app name or names array
   * @typedef {VueRoute & EnhancedRoute} Route
   *
   * @typedef {import('vue-router').default} VueRouter
   * @typedef {Object} EnhancedRouterRef
   * @property {import('vue-router').RouteConfig} options
   * @property {Object} matcher
   * @typedef {VueRouter & EnhancedRouterRef} Router
   */
  constructor(opts = {}) {
    super();

    // Auto install if it is not done yet and `window` has `Vue`.
    // To allow users to avoid auto-installation in some cases,
    // this code should be placed here.
    if (
      /* eslint-disable-next-line no-undef */
      // @ts-ignore
      !Vue &&
      typeof window !== 'undefined' &&
      // @ts-ignore
      window.Vue &&
      // @ts-ignore
      !VueMfe.install.installed
    ) {
      // @ts-ignore
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
    this.helpers = new EnhancedRouter(this.router);
    this.lazyloader = new Lazyloader().setConfig(this.config);

    this._init();
  }

  _init() {
    this.router.beforeEach((to, from, next) => {
      // when none-matched path
      if (
        to.matched.length === 0 ||
        this.router.match(to.path).matched.length === 0
      ) {
        const appName = this._getPrefixName(to);
        const args = { name: appName, to, from, next };

        if (this.isInstalled(appName)) {
          const childrenApps = this.helpers.getChildrenApps(
            to.path || to.fullPath
          );

          if (childrenApps && childrenApps.length) {
            return this._installChildrenApps(childrenApps, args)
          } else {
            const error = new Error(
              `${appName} has been installed but it has no any path ${to.path}`
            );
            // @ts-ignore
            error.code = VueMfe.ERROR_CODE.LOAD_DUPLICATE_WITHOUT_PATH;

            this.emit('error', error, args);
          }
        } else {
          return this.installApp(args)
        }
      } else {
        return next()
      }
    });
  }

  installApp(args) {
    const { name, next, to } = args;

    if (this.isInstalled(name)) {
      return true
    }

    this.installedApps[name] = VueMfe.LOAD_STATUS.START;
    this.emit('start', args);

    /**
     * handleSuccess
     * @param {boolean} success
     */
    const handleSuccess = (success) => {
      VueMfe.log(`install app ${name} success`, success);

      if (success) {
        this.installedApps[name] = VueMfe.LOAD_STATUS.SUCCESS;
        // After apply mini app routes, i must to force next(to)
        // instead of next(). next() do nothing... bug???
        next && to && next(to);

        this.emit('end', args);
      }

      return success
    };

    /**
     * handleError
     * @param {Error|string} error
     */
    const handleError = (error) => {
      if (!(error instanceof Error)) error = new Error(error);
      if (!error.code) error.code = VueMfe.ERROR_CODE.LOAD_ERROR_HAPPENED;

      this.installedApps[name] = VueMfe.LOAD_STATUS.FAILED;
      next && next(false); // stop navigating to next route

      this.emit('error', error, args); // error-first like node?! 😊
    };

    return this.loadAppEntry(args)
      .then((module) => this.executeAppEntry(module))
      .then((routes) => this.installAppModule(routes))
      .then(handleSuccess)
      .catch(handleError)
  }

  /**
   * @param {string|{name: string}} name
   * @returns {Promise<AppModule>}
   */
  loadAppEntry(name) {
    return this.lazyloader.load(typeof name === 'string' ? { name } : name)
  }

  /**
   * executeAppEntry
   * @description To executes the ESM/UMD app module
   * @typedef {import('vue').Component} VueComponent
   * @typedef {(app: VueComponent)=>Promise<Route[]>|Route[]|{init: (app: VueComponent)=>Promise<boolean>, routes: Route[]}} AppModule
   * @param {AppModule} module
   * @returns {Promise<Route[]>}
   * @summary
   *  1. module is a init function
   *    module: () => Promise<T>.then((routes: Array<Route> | boolean) => boolean)
   *  2. module is an array of routes
   *    module: Array<Route>
   *  3. module is an object with property 'init' and 'routes'
   *    module: { init: Function, routes: Array<Route> }
   */
  executeAppEntry(module) {
    module = resolveModule(module);

    /** @type {VueComponent}  */
    const app = this.router && this.router.app;

    if (isFunction(module)) {
      // routes: () => Promise<T>.then((routes: Array<Route> | boolean) => boolean)
      // @ts-ignore
      return Promise.resolve(module(app))
    } else if (isArray(module)) {
      // module: Array<Route>
      // @ts-ignore
      return module
    } else if (isObject(module)) {
      // module: { init: Promise<T>.then((success: boolean) => boolean), routes: Array<Route> }
      // @ts-ignore
      return isFunction(module.init) && Promise.resolve(module.init(app))
    }
  }

  /**
   * @param {Route[]} routes
   * @throws {Error}
   */
  installAppModule(routes) {
    if (isArray(routes)) {
      if (routes.length) {
        // @ts-ignore
        this.helpers.addRoutes(routes, this.config.parentPath);
        return true
      } else {
        VueMfe.warn('`Route[]` has no any valid item');
      }

      return false
    } else {
      let error = new Error(`Module ${name} initialize failed.`);
      if (routes instanceof Error) error = routes;

      // @ts-ignore
      error.code = VueMfe.ERROR_CODE.APP_INIT_FAILED;
      VueMfe.warn(error);

      return false
    }
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

  _installChildrenApps(apps, { next, to }) {
    const allPromises = apps.map((name) => this.installApp({ name }));

    return Promise.all(allPromises)
      .then((res) => {
        return res.every(Boolean)
      })
      .then((success) => {
        return success && next && to && next(to)
      })
  }

  /**
   * @description get the domain-app prefix name by current router and next route
   * @param {VueRoute} route
   * @returns {string} name
   */
  _getPrefixName(route) {
    return (
      // @ts-ignore
      route.domainName ||
      (route.name && route.name.includes('.')
        ? this._getPrefixNameByDelimiter(route.name, '.')
        : this._getPrefixNameByDelimiter(route.path, '/'))
    )
  }

  _getPrefixNameByDelimiter(str, delimiter) {
    return (
      (this.config.ignoreCase ? str.toLowerCase() : str)
        .split(delimiter)
        /* filter all params form route to get right name */
        .filter(
          (s) => !Object.values(this.router.currentRoute.params).includes(s)
        )
        .filter(Boolean)
        .map((s) => s.trim())
        .shift()
    )
  }
}

VueMfe.version = '1.0.4';
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
