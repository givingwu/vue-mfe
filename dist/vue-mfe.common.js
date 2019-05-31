/*!
  * vue-mfe v1.0.0
  * (c) 2019 Vuchan
  * @license MIT
  */
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var VueRouter = _interopDefault(require('vue-router'));

var isDev = process.env.NODE_ENV === 'development';

var isMaster = process.env.VUE_APP_MASTER !== undefined;

var isPortal = !isMaster || process.env.VUE_APP_PORTAL !== undefined;

var noop = function () {};

var isArray = function (arr) { return Array.isArray(arr); };

var isFunction = function (fn) { return fn && typeof fn === 'function'; };

var isObject = function (obj) { return obj && typeof obj === 'object'; };

var isString = function (str) { return typeof str === 'string'; };

var toArray = function (args) { return Array.prototype.slice.call(args); };

var hasConsole =
  // eslint-disable-next-line
  typeof console !== 'undefined' && typeof console.warn === 'function';

function assert(condition, onSuccess, onFailure) {
  if (condition) {
    return isFunction(onSuccess) && onSuccess()
  } else {
    return isFunction(onFailure) && onFailure()
  }
}

var getLogger = function (key) { return function (args) {
  return assert(
    isDev,
    // eslint-disable-next-line
    function () { return hasConsole && console.log.apply(null, key ? [key ].concat( toArray(args)) : args); },
    noop
  )
}; };

var getWarning = function (key) { return function (args) {
  var throwError = function (err) {
    throw new Error(err)
  };

  // eslint-disable-next-line
  var fn = isDev ? throwError : hasConsole ? console.warn : noop;

  return assert(true, function () {
    fn.apply(null, key ? [[key ].concat( toArray(args)).join(' > ')] : args);
  })
}; };

/**
 * @description resolve module whether ES Module or CommandJS module
 * @param {Module} module
 * @returns {any*}
 */
var resolveModule = function (module) { return ((module && module.default) || module); };

/**
 * @description execute an array of promises serially
 * @param {Array<Promise<T>>} promises
 * @returns {Promise<T>} the finally result of promises
 */
var serialExecute = function (promises) {
  return promises.reduce(function (chain, next) {
    return chain
      .then(function (retVal) { return next(retVal); })
      .catch(function (err) {
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
    var handlers = this.events[eventName];

    if (handlers && handlers.length) {
      if (listener) {
        return (handlers = handlers.filter(function (handler) { return handler === listener; }));
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
Observer.prototype.emit = function(eventName) {
  var data = [], len = arguments.length - 1;
  while ( len-- > 0 ) data[ len ] = arguments[ len + 1 ];

  var handlers = this.events[eventName];

  if (handlers) {
    handlers.forEach(function (handler) { return handler.apply(null, data); });
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
  var link = document.createElement('link');

  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.charset = 'utf-8';
  link.href = url;
  link.setAttribute('force', false);

  return new Promise(function (resolve, reject) {
    var timerId = setTimeout(function () { return clearState(true); }, 1.2e4);

    function clearState(isError) {
      clearTimeout(timerId);
      link.onerror = link.onload = link.onreadystatechange = null; // 同时检查两种状态，只要有一种触发就删除事件处理器，避免触发两次

      isError && link && link.remove();
    }

    link.onload = function() {
      clearState();
      resolve.apply(void 0, arguments);
    };

    link.onerror = function() {
      clearState(true);
      reject.apply(void 0, arguments);
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
  var script = document.createElement('script');

  script.type = 'text/javascript';
  script.charset = 'utf-8';
  script.src = url;
  script.async = true;
  script.setAttribute('nonce', 'nonce');

  return new Promise(function (resolve, reject) {
    var timerId = setTimeout(
      function () { return onLoadFailed(("Reject script " + url + ": LOAD_SCRIPT_TIMEOUT")); },
      1.2e4
    );

    function clearState() {
      clearTimeout(timerId);
      script.onerror = script.onload = script.onreadystatechange = null; // 同时检查两种状态，只要有一种触发就删除事件处理器，避免触发两次
      script.remove();
    }

    function onLoadSuccess() {
      var i = arguments.length, argsArray = Array(i);
      while ( i-- ) argsArray[i] = arguments[i];

      clearState();
      resolve.apply(void 0, [ globalVar ? window[globalVar] : undefined ].concat( argsArray ));
    }

    function onLoadFailed() {
      clearState();
      reject.apply(void 0, arguments);
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
        onLoadFailed(("GET " + url + " net::ERR_CONNECTION_REFUSED"), evt);
      };
    }

    document.body.appendChild(script);
  })
}

/**
 * @class Lazyloader
 * @description only focus on load resource from `config.getResource()`.
 */
var Lazyloader = function Lazyloader() {
  this.cached = {};
};

Lazyloader.log = function log () {
  return getLogger('VueMfe.' + Lazyloader.name)(arguments)
};

Lazyloader.warn = function warn () {
  return getWarning('VueMfe.' + Lazyloader.name)(arguments)
};

Lazyloader.prototype.load = function load (ref) {
    var this$1 = this;
    var name = ref.name;

  return this.getRouteEntry(name)
    .then(function (url) {
      var resource = isFunction(url) ? url() : url;
      Lazyloader.log('getRouteEntry resource', resource);

      return isDev && isObject(resource) && !isArray(resource)
        ? resource /* if local import('url') */
        : this$1.installResources(isArray(resource) ? resource : [resource], this$1.getName(name))
    })
};

Lazyloader.prototype.getRouteEntry = function getRouteEntry (name) {
    var this$1 = this;

  var cache = this.cached[name];

  if (cache) {
    return Promise.resolve(cache)
  } else {
    return Promise.resolve(this.getResource(name))
      .then(function (data) {
          if ( data === void 0 ) data = {};

        // merge cached with data
        this$1.cached = Object.assign({}, this$1.cached, data);

        if (data[name]) {
          return data[name]
        } else {
          Lazyloader.log('resources object', JSON.stringify(data));
          Lazyloader.warn(
            ("The '" + name + "' cannot be found in 'config.getResource()'")
          );
        }
      })
  }
};

/**
 * installResources
 * @description install JS/CSS resources
 * @param {Array<URL> | URL} urls
 * @param {string} name
 */
Lazyloader.prototype.installResources = function installResources (urls, name) {
  var allCss = urls.filter(function (url) { return url.endsWith('.css'); });
  var scripts = urls.filter(function (url) { return url.endsWith('.js'); });

  if (isArray(allCss) && allCss.length) {
    Promise.all(allCss.map(function (css) { return lazyloadStyle(css); })).catch(function (error) { return Lazyloader.warn(error); });
  }

  if (isArray(scripts) && scripts.length) {
    return serialExecute(
      scripts.map(function (script) { return function () { return lazyLoadScript(script, name); }; })
    ).catch(function (error) {
      throw error
    })
  } else {
    Lazyloader.warn(("no any valid entry script be found in " + urls));
  }
};

Lazyloader.prototype.getResource = function getResource (name) {
  return this.getConfig(name).getResource()
};

Lazyloader.prototype.getName = function getName (name) {
  return this.getConfig(name).getNamespace(name)
};

Lazyloader.prototype.getConfig = function getConfig (name) {
    if ( name === void 0 ) name = '*';

  return this.configs[name] || this.configs['*']
};

Lazyloader.prototype.setConfig = function setConfig (name, config) {
  if (isObject(name)) {
    config = name;
    name = '*';
  }

  if (!this.configs) {
    this.configs = {};
  }

  this.configs[name] = config;

  return this
};

/**
 * findRoute 深度优先递归遍历找到匹配 matchPath 的 Route
 * @param {Array<Route>} routes
 * @param {String} matchPath
 * @returns {Object<Route>}
 */
function findRoute(routes, matchPath) {
  if ( routes === void 0 ) routes = [];

  var i = 0;
  var matchedRoute = null;
  var l = routes.length;

  while (i < l) {
    var route = routes[i];
    var path = route.path;
    var children = route.children;

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
  var trailingSlashRE = /\/?$/;
  path = path !== '/' ? path.replace(trailingSlashRE, '') : path;

  return path ? (ensureSlash(path) ? path : '/' + path) : '/'
}

function ensureSlash(path) {
  return path.charAt(0) === '/'
}

function objectWithoutProperties (obj, exclude) { var target = {}; for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1) target[k] = obj[k]; return target; }

/**
 * @class EnhancedRouter
 * @description Dynamically add child routes to an existing route & provides some `helpers` method
 */
var EnhancedRouter = function EnhancedRouter(router) {
  if (router.addRoutes !== this.addRoutes) {
    router.addRoutes = this.addRoutes.bind(this);
  }

  this.router = router;
  this.routes = router.options.routes;
  this.pathMap = {};
  this.pathList = [];

  this._init();
};

EnhancedRouter.warn = function warn () {
  return getWarning(EnhancedRouter.name)(arguments)
};

EnhancedRouter.prototype._init = function _init () {
  this.refreshAndCheckState(this.routes);
};

/**
 * @description Add new routes into current router, and supports dynamic nest
 * @see
 *+ [Dynamically add child routes to an existing route](https://github.com/vuejs/vue-router/issues/1156)
 *+ [Feature request: replace routes dynamically](https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465)
 * @param {Array<Route>} routes VueRoute route option
 * @param {?String} parentPath
 */
EnhancedRouter.prototype.addRoutes = function addRoutes (routes, parentPath) {
  if (isDev) {
    console.log(this.pathList);
    console.log(this.pathMap);
  }

  this.refreshAndCheckState(routes, parentPath);
  this.router.matcher = new VueRouter(
    this.normalizeOptions(this.router.options, { routes: routes }, parentPath)
  ).matcher;
};

/**
 * @description normalize the options between oldRouter and newRouter with diff config options
 * @param {Object} oldOpts oldRouter VueRouter configuration options
 * @param {Object} newOpts newROuter VueRouter configuration options
 * @param {?String} parentPath
 * @returns {Object}
 */
EnhancedRouter.prototype.normalizeOptions = function normalizeOptions (oldOpts, newOpts, parentPath) {
  var oldRoutes = oldOpts.routes;
    var rest = objectWithoutProperties( oldOpts, ["routes"] );
    var oldProps = rest;
  var newRoutes = newOpts.routes;
    var rest$1 = objectWithoutProperties( newOpts, ["routes"] );
    var newProps = rest$1;

  return Object.assign(
    {
      routes: this.mergeRoutes(oldRoutes, newRoutes, parentPath)
    },
    newProps,
    oldProps
  )
};

/**
 * @description before merge new routes we need to check it out does its path or name duplicate in old routes
 * @param {Array<Route>} oldRoutes
 * @param {Array<Route>} newRoutes
 * @param {?String} parentPath
 * @returns {Array<Route>} oldRoutes
 */
EnhancedRouter.prototype.mergeRoutes = function mergeRoutes (oldRoutes, newRoutes, parentPath) {
  var needMatchPath = parentPath;

  newRoutes.forEach(function (route) {
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
        var oldRoute = findRoute(oldRoutes, parentPath);
        var path = route.path;

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
};

/**
 * @description 递归刷新路径 pathList 和 pathMap 并检查路由 path 和 name 是否重复
 * @param {Array<Route>} newRoutes
 * @param {String} parentPath
 *1. from method calls: addRoutes(routes, parentPath)
 *2. from route property: { path: '/bar', parentPath: '/foo', template: '<a href="/foo/bar">/foo/bar</a>' }
 */
EnhancedRouter.prototype.refreshAndCheckState = function refreshAndCheckState (routes, parentPath) {
    var this$1 = this;

  routes.forEach(function (ref) {
      var path = ref.path;
      var selfParentPath = ref.parentPath;
      var name = ref.name;
      var children = ref.children;

    /* 优先匹配 route self parentPath */
    if (selfParentPath) {
      path = this$1.getParentPath(path, selfParentPath, name);
    } else if (parentPath) {
      path = this$1.getParentPath(path, parentPath, name);
    }

    if (path) {
      if (!this$1.pathExists(path)) {
        this$1.pathList.push(path);
      } else {
        EnhancedRouter.warn(("The path " + path + " in pathList has been existed"));
      }
    }

    if (name) {
      if (!this$1.nameExists(name)) {
        this$1.pathMap[name] = path;
      } else {
        EnhancedRouter.warn(("The name " + name + " in pathMap has been existed"));
      }
    }

    if (children && children.length) {
      return this$1.refreshAndCheckState(children, path)
    }
  });
};

EnhancedRouter.prototype.getParentPath = function getParentPath (path, parentPath, name) {
  if (this.pathExists(parentPath)) {
    return (path = completePath(path, parentPath))
  } else {
    EnhancedRouter.warn(
      ("Cannot found the parent path " + parentPath + " " + (name ? 'of ' + name : '') + " in Vue-MFE MasterRouter")
    );
    return ''
  }
};

EnhancedRouter.prototype.pathExists = function pathExists (path) {
  return this.pathList.includes(path)
};

EnhancedRouter.prototype.nameExists = function nameExists (name) {
  return this.pathMap[name]
};

EnhancedRouter.prototype.findRoute = function findRoute$1 (route) {
  var path = (isString(route) && route) || (isObject(route) && route.path);
  return (path && findRoute(this.routes, path)) || null
};

function objectWithoutProperties$1 (obj, exclude) { var target = {}; for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1) target[k] = obj[k]; return target; }

var _Vue;

/**
 * @class VueMfe
 * @description Vue micro front-end Centralized Controller
 */
var VueMfe = /*@__PURE__*/(function (Observer$$1) {
  function VueMfe(opts) {
    if ( opts === void 0 ) opts = {};

    Observer$$1.call(this);

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

    var router = opts.router;
    var rest = objectWithoutProperties$1( opts, ["router"] );
    var config = rest;

    this.router = router;
    this.config = Object.assign({}, VueMfe.DEFAULTS, config);
    this.installedApps = {};

    this._init();
  }

  if ( Observer$$1 ) VueMfe.__proto__ = Observer$$1;
  VueMfe.prototype = Object.create( Observer$$1 && Observer$$1.prototype );
  VueMfe.prototype.constructor = VueMfe;

  VueMfe.log = function log () {
    return getLogger(VueMfe.name)(arguments)
  };

  VueMfe.warn = function warn () {
    return getWarning(VueMfe.name)(arguments)
  };

  /**
   * @description To support a new Vue options `mfe` when Vue instantiation
   * see https://github.com/vuejs/vuex/blob/dev/src/mixin.js
   * @param {*} Vue
   */
  VueMfe.install = function install (Vue) {
    if (VueMfe.install.installed && _Vue === Vue) { return }
    VueMfe.install.installed = true;

    _Vue = Vue;

    var version = Number(Vue.version.split('.')[0]);

    if (version >= 2) {
      Vue.mixin({ beforeCreate: initVueMfe });
    } else {
      // override init and inject vuex init procedure
      // for 1.x backwards compatibility.
      var _init = Vue.prototype._init;
      Vue.prototype._init = function(options) {
        if ( options === void 0 ) options = {};

        options.init = options.init
          ? [initVueMfe].concat(options.init)
          : initVueMfe;
        _init.call(this, options);
      };
    }

    function initVueMfe() {
      var options = this.$options;
      // store injection
      if (options.mfe) {
        this.$mfe =
          typeof options.mfe === 'function' ? options.mfe() : options.mfe;
      } else if (options.parent && options.parent.$mfe) {
        this.$mfe = options.parent.$mfe;
      }
    }
  };

  VueMfe.prototype._init = function _init () {
    var this$1 = this;

    this.helpers = new EnhancedRouter(this.router);
    this.lazyloader = new Lazyloader().setConfig(this.config);

    this.router.beforeEach(function (to, from, next) {
      if (
        to.matched.length === 0 ||
        this$1.router.match(to.path).matched.length === 0
      ) {
        var appName = this$1._getPrefixName(to);
        var args = { name: appName, to: to, from: from, next: next };

        if (this$1.isInstalled(appName)) {
          var error = new Error(
            (appName + " has been installed but it does not have path " + (to.path))
          );
          error.code = VueMfe.ERROR_CODE.LOAD_DUPLICATE_WITHOUT_PATH;

          this$1.emit('error', error, args);
        } else {
          this$1.installApp(args);
        }
      } else {
        next();
      }
    });
  };

  VueMfe.prototype.installApp = function installApp (args) {
    var this$1 = this;

    var name = args.name;
    var next = args.next;
    var to = args.to;

    this.installedApps[name] = VueMfe.LOAD_STATUS.START;
    this.emit('start', args);

    return this.lazyloader
      .load(args)
      .then(function (module) {
        VueMfe.log('install App module', module);

        return this$1.installModule(module)
      })
      .then(function (success) {
        VueMfe.log(("install App " + name + " success"), success);

        if (success) {
          this$1.installedApps[name] = VueMfe.LOAD_STATUS.SUCCESS;

          // After apply mini app routes, i must to force next(to)
          // instead of next(). next() do nothing... bug???
          next && to && next(to);
          this$1.emit('end', args);
        }
      })
      .catch(function (error) {
        if (!(error instanceof Error)) { error = new Error(error); }
        if (!error.code) { error.code = VueMfe.ERROR_CODE.LOAD_ERROR_HAPPENED; }
        this$1.installedApps[name] = VueMfe.LOAD_STATUS.FAILED;

        next && next(false); // stop navigating to next route
        this$1.emit('error', error, args);
      })
  };

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
  VueMfe.prototype.installModule = function installModule (module) {
    var this$1 = this;

    module = resolveModule(module);

    var router = this.router;
    var app = router.app || {};

    // call init mini app (add routes mini app):
    if (module) {
      if (isFunction(module)) {
        // routes: () => Promise<T>.then((routes: Array<Route> | boolean) => boolean)
        return Promise.resolve(module(app)).then(function (routesOrBool) {
          return this$1._checkRoutes(routesOrBool)
        })
      } else if (isArray(module)) {
        // module: Array<Route>
        return this.addRoutes(module)
      } else if (isObject(module)) {
        // module: { init: Promise<T>.then((success: boolean) => boolean), routes: Array<Route> }
        return (
          isFunction(module.init) &&
          Promise.resolve(module.init(app)).then(function (bool) {
            return bool === false || bool instanceof Error
              ? this$1._checkRoutes(bool)
              : this$1.addRoutes(module.routes)
          })
        )
      }
    } else {
      return false
    }
  };

  VueMfe.prototype.addRoutes = function addRoutes (routes, parentPath) {
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
  };

  VueMfe.prototype.isInstalled = function isInstalled (route) {
    var name = route;

    if (isObject(route) && /\//.exec(route.path)) {
      name = this._getPrefixName(route);
    } else if (isString(route) && /\//.exec(route)) {
      name = this._getPrefixNameByDelimiter(route, '/');
    }

    return this.installedApps[name] === VueMfe.LOAD_STATUS.SUCCESS
  };

  VueMfe.prototype.preinstall = function preinstall (name) {
    return name && this.installApp({ name: name })
  };

  /**
   * @description get the domain-app prefix name by current router and next route
   * @param {VueRoute} route
   * @returns {string} name
   */
  VueMfe.prototype._getPrefixName = function _getPrefixName (route) {
    return (
      route.domainName ||
      (route.name && route.name.includes('.')
        ? this._getPrefixNameByDelimiter(route.name, '.')
        : this._getPrefixNameByDelimiter(route.path, '/'))
    )
  };

  VueMfe.prototype._getPrefixNameByDelimiter = function _getPrefixNameByDelimiter (str, delimiter) {
    var this$1 = this;

    return (
      (this.config.ignoreCase ? str.toLowerCase() : str)
        .split(delimiter)
        /* filter all params form router to get right name */
        .filter(
          function (s) { return !Object.values(this$1.router.currentRoute.params).includes(s); }
        )
        .filter(Boolean)
        .map(function (s) { return s.trim(); })
        .shift()
    )
  };

  VueMfe.prototype._checkRoutes = function _checkRoutes (routesOrBool) {
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
  };

  return VueMfe;
}(Observer));

VueMfe.version = '__VERSION__';
VueMfe.DEFAULTS = {
  ignoreCase: true,
  parentPath: null,
  getNamespace: function (name) { return ("__domain__app__" + name); }
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

module.exports = VueMfe;
