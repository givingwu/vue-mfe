/*!
  * vue-mfe v0.1.4
  * (c) 2019 Vuchan
  * @license MIT
  */
import Vue from 'vue';
import VueRouter from 'vue-router';

const isArray = (arr) => Array.isArray(arr);

const isFunction = (fn) => fn && typeof fn === 'function';

const isObject = (obj) => obj && typeof obj === 'object';

const isString = (str) => typeof str === 'string';

/**
 * capitalize
 * @param {String} str
 */
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
};

/**
 * camelize
 * @param {String} str
 * @param {Boolean} pascalCase
 */
const camelize = (str, pascalCase = false) => {
  return str
    .split(/-|_|\s/g)
    .map((s, i) => (!pascalCase && i === 0 ? s : capitalize(s)))
    .join('')
};

const resolveModule = (module) => {
  return (module && module.default) || module
};

const getAppPrefixName = (to) =>
  to.name && to.name.includes('.')
    ? filterByDelimiter(to.name, '.')
    : filterByDelimiter(to.path, '/');

function filterByDelimiter(str, delimiter) {
  return (
    str
      .split(delimiter)
      /* filter all params form router to get right name */
      .filter(
        (s) => !Object.values(GlobalPageRouter.currentRoute.params).includes(s)
      )
      .filter(Boolean)
      .map((s) => s.trim())
      .shift()
  )
}

const defineImmutableProp = (obj, key, val) => {
  Object.defineProperty(obj, key, {
    value: val,
    configurable: false,
    enumerable: false,
    writable: false,
  });
};

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
 * lazyLoadScript
 * @author Vuchan
 * @desc lazy load script form a remote url then returns a promise
 * @param {String} url remote-url
 * @param {String} globalVar global variable key
 * @return {Promise}
 */
function lazyLoadScript(url, globalVar) {
  const script = document.createElement('script');
  const timeout = 120000;

  script.type = 'text/javascript';
  script.charset = 'utf-8';
  script.src = url;
  script.async = true;
  script.setAttribute('nonce', 'nonce');

  let _reject = null;
  let _resolve = null;

  function onLoadFailed() {
    clearState();
    _reject && _reject(...arguments);
  }

  function onLoadSuccess() {
    _resolve && _resolve(globalVar ? window[globalVar] : undefined);
    clearState();
  }

  function clearState() {
    clearTimeout(timerId);
    script.onerror = script.onload = script.onreadystatechange = null; // 同时检查两种状态，只要有一种触发就删除事件处理器，避免触发两次
    script.remove();
  }

  document.body.appendChild(script);

  /* 在 appendChild 之后开始计时 */
  let timerId = setTimeout(
    () => onLoadFailed(`Reject script ${url} error`),
    timeout
  );

  return new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;

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
          onLoadFailed(`Unknown error happened`, evt);
        }
      };
    } else {
      // Others
      script.onload = function load() {
        onLoadSuccess();
      };

      script.onerror = function error(evt) {
        onLoadFailed(`GET ${url} net::ERR_CONNECTION_REFUSED`, evt);
      };
    }
  })
}

const isDev = "development" === 'development';
const isMaster = true !== undefined;

function assert(condition, onSuccess, onFailure) {
  if (condition) {
    return isFunction(onSuccess) && onSuccess()
  } else {
    return isFunction(onFailure) && onFailure()
  }
}

function info() {
  return assert(isDev, () => console.info.apply(console, arguments))
}

function warn() {
  const fn =
    (!isDev &&
      (typeof console !== 'undefined' &&
        typeof console.warn === 'function' &&
        console.warn)) ||
    ((err) => {
      throw new Error(err)
    });

  return assert(true, () => {
    fn.apply(this, arguments);
  })
}

/**
 * createMasterRouter
 * @description 如果是 MasterRouter 则直接覆盖 PageRouter
 * @param {Array|Object} routesOrConfig
 * @returns
 */
function createMasterRouter$$1(routesOrConfig) {
  if (isArray(routesOrConfig)) {
    return createPageRouter(routesOrConfig)
  } else if (isObject(routesOrConfig)) {
    const { routes, mode, ...config } = routesOrConfig;

    if (isArray(routes) && routes.length) {
      return createPageRouter(routes, config, mode)
    }
  }

  warn(
    'Must pass a valid routes array for `createMaster(config: { routes: Array<Route>, [props]: any }): Object<Master>>`'
  );
}

/* install router plugin */
Vue.use(VueRouter);

/**
 * master-memo-cache
 * 在 master-router 中维护的 pathList、pathMap，VueRouter 中也维护了这两个变量，但是没有暴露。
 * 本地维护有两个目的:
 *  1. 是在当 portal-router 中调用 `addDomainRoutes` 时，比对、校验、去重
 *  2. 暴露给 portal-app 看其是否需要，如果上游做了很完善的逻辑判断，似乎没必要在暴露到下游
 */
let pathList = [];
let pathMap = {};

// 内部维护的两个闭包变量 _router, _routes
let _router = null; // router: VueRouter
let _routes = []; // routes: Array<Route>

/**
 * createRouter 根据 routes 创建 router，但会新增一些内部方法以增强router
 * @param {Array<Route>} routes
 * @returns {Object<Router<VueRouter>>}
 * @inspired from https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
 */
const createRouter = (routes = [], mode = 'history') => {
  /* 刷新内部私有的闭包变量 _routes */
  if (!_routes || !_routes.length) _routes = routes;

  /* 刷新维护的路由状态 */
  refreshPathStates(routes);

  {
    info('pathList: ', pathList);
    info('pathMap: ', pathMap);
  }

  let router = new VueRouter({
    routes,
    // Use the HTML5 history API (i.e. normal-looking routes)
    // instead of routes with hashes (e.g. example.com/#/about).
    // This may require some server configuration in production:
    // https://router.vuejs.org/en/essentials/history-mode.html#example-server-configurations
    mode,
    // Simulate native-like scroll behavior when navigating to a new
    // route and using back/forward buttons.
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      } else {
        return { x: 0, y: 0 }
      }
    },
  });

  /*
   * 只能赋值1次，不可重复赋值。后续赋值更新了闭包中 _router 的引用，导致当前 router 的实例被更新。
   * 因为 _router.matcher === router.matcher 导致 resetRouter 中的动态修改 _router.matcher 无法生效
   */
  if (!_router) {
    _router = router;
    const helpers = Object.create(null);

    defineImmutableProp(helpers, 'completePaths', completePaths);
    defineImmutableProp(helpers, 'findRoute', findRoute);
    defineImmutableProp(helpers, 'findPathName', findPathName);
    defineImmutableProp(helpers, 'nameExists', nameExists);
    defineImmutableProp(helpers, 'pathExists', pathExists);

    // 增加实例自身属性 addRoutes，不复写原型构造函数的成员方法
    defineImmutableProp(_router, 'addRoutes', addDomainRoutes);
    // 挂载工具方法 helpers 到 router 实例上 router.helpers.findPathName(path: String)
    defineImmutableProp(_router, 'helpers', helpers);
  }

  return router
};

/* 重置 master-router 的路由映射 Matcher */
function resetRouter(routes) {
  const newRouter = createRouter(routes);
  _router.matcher = newRouter.matcher; // the relevant part

  return _router
}

/**
 * addDomainRoutes 添加新的 portal 路由，可按需指定嵌套的 parentPath
 * @param {Array<Route>} newRoutes 需要被注册到 master-router 的新路由
 * @param {routePath: String = '/'} prependPath
 *  newRoutes 默认注册到 '/' 的 children 下
 *  prependPath 优先级： prependPath parameter < route.parentPath
 * @summary
 *  1. 除非调用 resetRouter 方法，否则所有现有路由的 path 和 name 都是不允许被覆盖的
 * @issue
 *  + route 的 path 不能带有 '/' 前缀
 *  `Note that nested paths that start with / will be treated as a root path. This allows you to leverage the component nesting without having to use a nested URL.`
 *  + route: { path: '/b', parentPath: '/error' } 在 master-router 存在 '/error' 的前提下，调用 router.match('/error/b') 无法 match
 */
function addDomainRoutes(newRoutes = [], prependPath = '/') {
  let hasParentPathRouteLength = 0;
  const noParentPathRoutes = []; /* 没有声明 */
  const unRegisteredRoutes = newRoutes
    .filter((route) => {
      /* 过滤掉存在单个 parentPath 的路由 */
      if (!route.parentPath) {
        noParentPathRoutes.push(route);
        return false
      } else {
        /* 更新 flag，并返回 boolean */
        return Boolean(++hasParentPathRouteLength)
      }
    })
    .filter(
      (route) => !registerRoute(route) /* filter 取非返回注册未成功的路由 */
    );

  if (prependPath && noParentPathRoutes.length) {
    unRegisteredRoutes.concat(
      noParentPathRoutes.filter(
        (route) =>
          !registerRoute(Object.assign(route, { parentPath: prependPath }))
      )
    );
  }

  /* 当所有路由全部注册成功后，才重设 Matcher */
  if (
    /* 不存在 parentPathRoute && prependPath 或者 未注册成功的路由长度为0 */
    (!hasParentPathRouteLength && !prependPath) ||
    unRegisteredRoutes.length === 0
  ) {
    return resetRouter(_routes)
  } else {
    info('hasParentPathRouteLength: ', hasParentPathRouteLength);
    info('prependPath: ', prependPath);
    info('unRegisteredRoutes: ', unRegisteredRoutes);

    warn(
      `Add routes failed, those routes ${JSON.stringify(
        unRegisteredRoutes
      )} cannot be registered.`
    );
  }
}

/**
 * @method refreshPathStates
 * @description 递归刷新 pathList 和 pathMap
 * @param {Array<Route>} newRoutes
 * @param {String} parentPath
 */
function refreshPathStates(newRoutes = [], parentPath = '') {
  newRoutes.forEach(({ path, name, children }) => {
    if (parentPath) path = completePaths(path, parentPath);
    if (name && !pathMap[name]) pathMap[name] = path;
    if (path && !pathList.includes(path)) pathList.push(path);

    if (children && children.length) {
      refreshPathStates(children, path);
    }
  });
}

/**
 * registerRoute 递归注册新路由
 * @param {Object<Route>} route
 * @param {Array<Route>} beforeRoutes
 * @returns {Boolean} true: 注册成功，false: 注册失败
 */
function registerRoute(
  { path, name, parentPath, ...props },
  beforeRoutes = _routes
) {
  const completePath = parentPath ? completePaths(path, parentPath) : path;
  const existsPath = parentPath ? pathExists(completePath) : pathExists(path);
  const existNameWithPath = name && nameExists(name);

  assert(existsPath, () => {
    const pathName = findPathName(name);
    const errorMsg = `
      The path ${path} cannot be registered ${
      parentPath ? 'to parentPath ' + parentPath : ''
    },
      because of it was already registered ${
        pathName ? 'in pathMap ' + pathName : ''
      }before.
    `;

    assert(
      /* 业务开发过程中，可能需要在自己开环境使用 path === '/' */
      path === '/',
      () => isDev && console.warn(errorMsg),
      () => warn(errorMsg)
    );
  });

  assert(existNameWithPath, () =>
    warn(`
      The name ${name} cannot be registered to path ${path}
      ${parentPath ? ' with parentPath ' + parentPath : ''}
    },
      because of it already registered in pathList ${existNameWithPath} before.
    `)
  );

  const route = Object.assign(
    {
      path:
        (
          parentPath !== '/' &&
          path.startsWith('/')
            ? path.replace(/^\/*/, '')
            : path
        ) /* fix: addDomainRoutes() @issue */,
      name,
    },
    props || {}
  );

  /* 如果存在 parentPath 且 parentPath 已存在记录 */
  if (parentPath && pathExists(parentPath)) {
    /* 递归找到匹配 parentPath 的 matchedRoute */
    const matchedRoute = findRoute(beforeRoutes, parentPath);

    if (matchedRoute) {
      if (matchedRoute.children && matchedRoute.children.length) {
        /* 这里不用再判断当前的 matchedRoute.children中 是否已存在相同的 completePath，因为上面的 existsPath 已经处理过 */
        matchedRoute.children.push(route);
      } else {
        matchedRoute.children = [route];
      }

      /* 注册成功 */
      return true
    } else {
      warn(
        `Register path '${path}' failed, cannot found parent path '${parentPath}',
        Are you sure the parent path exists in MasterRouter/routes before?`
      );
    }
  } else {
    if (parentPath !== undefined && typeof parentPath === 'string') {
      beforeRoutes.push(route);
    } else {
      warn(
        `Register path '${path}' failed, parentPath '${parentPath} does not exist'`
      );
    }
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

function completePaths(path, parentPath) {
  if (parentPath === '/' && path !== '/' && path.startsWith('/')) {
    return ensurePathSlash(path)
  } else {
    return ensurePathSlash(parentPath) + ensurePathSlash(path)
  }
}

function ensurePathSlash(path) {
  const trailingSlashRE = /\/?$/;
  path = path !== '/' ? path.replace(trailingSlashRE, '') : path;

  return path ? (ensureSlash(path) ? path : '/' + path) : ''
}

function ensureSlash(path) {
  return path.charAt(0) === '/'
}

function pathExists(path) {
  return pathList.includes(path)
}

function nameExists(name) {
  return pathMap[name]
}

function findPathName(path) {
  return Object.keys(pathMap).find((name) => pathMap[name] === path)
}

function getRouter() {
  return _router
}

function getRoutes() {
  return _routes
}

let cached = null;

function lazyloader(to, next) {
  const name = camelize(getAppPrefixName(to));
  const config = getMasterConfig(name) || {};
  const { onLoadStart, onLoadSuccess, onLoadError, getNamespace = () => `__domain__app__${name}` } = config;

  isFunction(onLoadStart) && onLoadStart(name, config);
  info('app-name: ', name);

  return getRouteEntry(name, next)
    .then((url) => {
      return isDev && isObject(url) && !isArray(url)
        ? url
        : installScript(url, getNamespace(name))
    })
    .then((module) => {
      if (module) {
        return installModule(module)
      } else {
        throw new Error(
          `[vue-mfe/lazyloader]: Cannot get valid value of Module ${name}`
        )
      }
    })
    .then((success) => {
      if (success) {
        next(to);
        isFunction(onLoadSuccess) && onLoadSuccess(name, config);
      } else {
        throw new Error(`[vue-mfe/lazyloader]: Register dynamic routes failed`)
      }
    })
    .catch((error) => {
      isFunction(onLoadError) ? onLoadError(error, next) : next(false);
    })
}

/**
 * getRouteEntry
 * @todo TODO: 如果是本地开发环境，则此处不需要发起请求，import 本地资源即可
 * @desc 获取 Portal 路由入口 entry-[chunkhash:8].umd.js 文件
 * @param {Object} data => cached
 * @param {String} names => portal app name
 * @returns {Object|undefined}
 */
function getRouteEntry(name, next) {
  /* 先取本地JS Heap中缓存，无缓存再取Server */
  if (cached && cached[name]) {
    return Promise.resolve(cached[name])
  } else {
    return getResource().then((data) => {
      if (data) {
        // merge cached with data
        cached = Object.assign({}, cached, data);

        if (cached[name]) {
          return cached[name]
        } else {
          info('[vue-mfe/getRouteEntry]: resources object: ', data);
          warn(
            `[vue-mfe/getRouteEntry]: The '${name}' cannot be found in resources object: ${JSON.stringify(
              Object.keys(data)
            )}`
          );

          next(false);
        }
      } else {
        return next({ name: 404 })
      }
    })
  }
}

function getResource() {
  const config = getMasterConfig();

  try {
    return config && config.getResource && config.getResource()
  } catch (e) {
    return Promise.reject(e)
  }
}

/**
 * installScript
 * @desc 懒加载 JS 资源
 * @param {Array<String<URL>>|String<URL>} urls
 * @param {String} name
 */
function installScript(urls, name) {
  if (isArray(urls) && urls.length) {
    return serialExecute(
      urls.map((url) => () => lazyLoadScript(url, name))
    ).catch((err) => {
      throw err
    })
  } else if (isString(urls)) {
    return serialExecute([() => lazyLoadScript(urls, name)])
  }
}

function installModule(module) {
  module = resolveModule(module);

  const router = getRouter();
  const app = router.app || {};
  let routes = null;

  // call init mini app (add routes mini app):
  if (module) {
    if (isFunction(module)) {
      // const value = await module(app)
      return Promise.resolve(module(app)).then(routes => {
        if (isArray(routes) && routes.length) {
          return router.addRoutes(routes)
        } else if (routes === false) {
          return warn(`[vue-mfe/installModule]: Module ${name} initialize failed.`)
        }
      })
    }

    // 如果直接是数组，则直接把这些数组理解成 routes
    if (isArray(module)) {
      routes = module;
    } else if (isObject(module)) {
      // 如果不想进入后续逻辑，可在 init 函数中抛出错误即可
      // 因为 installModule 会 catch 这个错误然后抛出异常
      isFunction(module.init) && module.init(app);

      if (module.routes && module.routes.length) {
        routes = module.routes;
      } else {
        return warn(
          `[vue-mfe/installModule]: Must pass a valid routes array in 'module.routes' property of ${name}!`
        )
      }
    }

    router.addRoutes(routes);

    // After apply mini app routes, i must to force next(to)
    // instead of next(). next() do nothing... bug???
    // next(to)
    return true
  } else {
    // stop navigating to next route
    // next(false)
    return false
  }
}

function createRouterInterceptor(router) {
  router.beforeEach((to, from, next) => {
    /* 如果是本地开发环境或者是 MasterRuntime 都需要对未知路由进行懒加载处理 */
    if (isDev || isMaster) {
      if (router.match(to.path).matched.length === 0) {
        lazyloader(to, next);
      } else {
        next();
      }
    } else {
      next({ name: 404 });
    }
  });
}

/**
 * createPageRouter 中心化路由
 * @description 闭包缓存 _router, _routes & _config
 * @param {Array<Route>} routes
 * @returns {}
 */
function createPageRouter(routes, config, mode) {
  let hasRouter = hasMasterRouter();
  let router = hasRouter ? addDomainRoutes(routes) : createRouter(routes, mode);

  /* flag: 是否绑定增强特性 */
  if (!hasRouter) {
    router._config = config || {};
    /* 创建全局引用，避免 portal 覆盖了 GlobalPageRouter */
    defineImmutableProp(window, 'GlobalPageRouter', router);
    /* 拦截未装载路由 */
    createRouterInterceptor(router);
  }

  return router
}
function hasMasterRouter() {
  return window.GlobalPageRouter !== null && getRouter() !== null
}
function getMasterConfig() {
  return (hasMasterRouter() && getRouter()._config) || {}
}

export { createPageRouter, getRouter as getMasterRouter, getRoutes as getMasterRoutes, createMasterRouter$$1 as createMasterRouter, hasMasterRouter, getMasterConfig };
