/*!
  * vue-mfe v1.0.8
  * (c) 2019 Vuchan
  * @license MIT
  */
import VueRouter from 'vue-router';

// @ts-ignore
var isDev = process.env.NODE_ENV === 'development';
// export const isMaster = true !== undefined
// export const isPortal = !isMaster || undefined !== undefined

var isArray = function (arr) { return Array.isArray(arr); };

var isFunction = function (fn) { return fn && typeof fn === 'function'; };

var isObject = function (obj) { return obj && typeof obj === 'object'; };

var isString = function (str) { return typeof str === 'string'; };

var hasConsole = // eslint-disable-next-line no-console
  typeof console !== 'undefined' && typeof console.warn === 'function';

var warn = function warning() {
  if (isDev) {
    throw Error.apply(window, arguments)
  } else {
    // eslint-disable-next-line no-console
    hasConsole && console.warn.apply(arguments);
  }
};

// @ts-nocheck
/**
 * @description lazy load style from a remote url then returns a promise
 * @param {String} url remote-url
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

      isError && link && remove(link);
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
 * @description lazy load script from a remote url then returns a promise
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
      remove(script);
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
 * @typedef {import("../..").AppConfig} AppConfig
 * @typedef {import("../..").SubAppConfig} SubAppConfig
 */
/** @type {Map<string, SubAppConfig>} */
var configMap = new Map();

/**
 * @returns {import('../..').Router}
 */
// @ts-ignore
var getRouter = function () { return getConfig().router; };

var getRootApp = function () { return getRouter().app; };

/**
 * getVarName
 * @param {string} prefix
 */
var getVarName = function (prefix) {
  return getConfig(prefix).globalVar || '__domain__app__' + prefix
};

/**
 * getAppName
 * @param {string} prefix
 */
var getAppName = function (prefix) {
  return getConfig(prefix).name
};

/**
 * getConfig
 * @param {string} prefix
 * @returns {SubAppConfig}
 */
var getConfig = function (prefix) {
  if ( prefix === void 0 ) prefix = '*';

  // @ts-ignore
  return configMap.get(prefix) || {}
};

/**
 * registerApp 注册应用并记录配置到 configMap
 * @param {string|AppConfig|SubAppConfig} prefix
 * @param {SubAppConfig} [config]
 */
var registerApp = function (prefix, config) {
  // 默认的全局配置为 { *: config }
  if (isObject(prefix)) {
    // @ts-ignore
    config = prefix;
    prefix = config.prefix || '*';
  }

  if (isString(prefix) && isObject(config)) {
    // @ts-ignore
    return configMap.set(prefix, config)
  }

  return false
};

/**
 * @typedef {import('../..').Resources} Resources
 */
/** @type {Map<string, Resources>} */
var resources = new Map();

/**
 * getResource
 * @param {string} prefix
 * @returns {import('../..').Resources}
 */
var getResource = function (prefix) {
  // 0. 先取缓存中的值
  var cached = resources.get(prefix);

  if (cached && isObject(cached)) {
    return cached
  }

  // 1. 再取 SubApp.config
  var config = getConfig(prefix);

  if (!config || !config.resources) {
    // 2. 最后取 HostApp.config
    config = getConfig();
  }

  if (config && config.resources) {
    if (isFunction(config.resources)) {
      // @ts-ignore
      var resource = config.resources();
      resources.set(prefix, resource);

      return resource
    }

    if (isObject(config.resources)) {
      var resource$1 = config.resources;
      resources.set(prefix, resource$1);

      return resource$1
    }
  }
};

/* eslint-disable */

var cached = {};

/**
 * load 根据 prefix 加载 resources
 * @param {string} prefix
 */
function load(prefix) {
  return (
    cached[prefix] ||
    getEntries(prefix).then(function (url) {
      var resources = isFunction(url) ? url() : url;

      try {
        return isDev && isObject(resources) && !isArray(resources)
          ? resources /* when local import('url') */
          : (cached[prefix] = install(
              (isArray(resources) ? resources : [resources]).filter(Boolean),
              getVarName(prefix)
            ))
      } catch (error) {
        console.log('error: ', error);
        throw new Error(error)
      }
    })
  )
}

/**
 * getEntries 获取资源入口
 * @param {string} key
 */
var getEntries = function (key) {
  return Promise.resolve(getResource(key)).then(function (obj) {
    return (
      (obj && obj[key]) ||
      warn(("The App key '" + key + "' cannot be found in " + (JSON.stringify(obj))))
    )
  })
};

/**
 * install
 * @description install .js or .css files
 * @typedef {string} Link
 * @param {Array<Link>} urls
 * @param {string} name
 *
 * @returns {Promise<import('..').Resource>}
 */
var install = function (urls, name) {
  var css = urls.filter(function (url) { return url.endsWith('.css'); });
  var scripts = urls.filter(function (url) { return url.endsWith('.js'); });

  if (isArray(css) && css.length) {
    Promise.all(css.map(function (css) { return lazyloadStyle(css); })).catch(warn);
  }

  if (isArray(scripts) && scripts.length) {
    return serialExecute(
      // @ts-ignore
      scripts.map(function (script) { return function () { return lazyLoadScript(script, name); }; })
    ).catch(function (error) {
      warn(error);
    })
  } else {
    warn(("No any valid script be found in " + urls));
  }
};

/**
 * @description execute an array of promises serially
 * @template T
 * @param {Array<Promise<T>>} promises
 * @returns {Promise<T>} the finally result of promises
 */
var serialExecute = function (promises) {
  return promises.reduce(function (chain, next) {
    return (
      chain
        // @ts-ignore
        .then(function (retVal) { return next(retVal); })
        .catch(function (err) {
          throw err
        })
    )
  }, Promise.resolve())
};

/**
 * findRoute DFS
 * @typedef {import('vue-router').RouteConfig} Route
 * @param {Array<Route>} routes
 * @param {String} path
 * @returns {Route}
 */
function findRoute(routes, path) {
  if ( routes === void 0 ) routes = [];

  if (routes) {
    var route;

    for (var i = 0; i < routes.length; i++) {
      route = routes[i];

      if (route.path === path) {
        return route
      }

      if (route.children && (route = findRoute(route.children, path))) {
        return route
      }
    }
  }
}

/**
 * isRoute
 * @param {Route} obj
 */
function isRoute(obj) {
  return obj && isObject(obj) && obj.path && obj.component
}

var LOAD_START = 'load-start';
var LOAD_SUCCESS = 'load-success';
var LOAD_ERROR = 'load-error';

function createError(error, message, code, prefix, args) {
  if (!error) {
    if (!(error instanceof Error)) {
      error = new Error("【" + (getAppName(prefix) || prefix) + "】：" + message);
    }

    // 如果非开发环境，将 ERROR 转换为普通对象，而非错误被抛出
    if (!isDev) {
      error = {
        code: error.code || code,
        message: error.message || message,
        stack: error.stack
      };
    }
  }

  if (code && !error.code) {
    error.code = code;
  }

  if (prefix && !error.name) {
    error.name = prefix;
  }

  getRootApp().$emit(LOAD_ERROR, error, args);
}

var SUCCESS = 1;
var START = 0;
var FAILED = -1;

// 记录 app 加载状态
var appStatus = {};

/**
 * isInstalled 已安装
 * @param {string} prefix
 */
function isInstalled(prefix) {
  return appStatus[prefix] === SUCCESS
}

/**
 * isInstalling 正在安装
 * @param {string} prefix
 */
function isInstalling(prefix) {
  return appStatus[prefix] === START
}

function setAppStatus(prefix, status) {
  return (appStatus[prefix] = status)
}

var LOAD_ERROR_HAPPENED = 'LOAD_ERROR_HAPPENED';
var LOAD_DUPLICATE_WITHOUT_PATH = 'LOAD_DUPLICATE_WITHOUT_PATH';

/**
 * @typedef {import('../index').Route} Route
 * @typedef {import('../index').Router} Router
 * @typedef {import('vue').default} VueComponent
 *
 * install
 * @param {{ name: string, next?: Function, to?: {}, app?: VueComponent }} args
 */
var install$1 = function (args) {
  var name = args.name;
  var next = args.next;
  var to = args.to;

  if (isInstalled(name)) {
    return true
  }

  var app = getRootApp();

  setAppStatus(name, START);
  app.$emit(LOAD_START, args);

  var handleSuccess = function () {
    setAppStatus(name, SUCCESS);
    app.$emit(LOAD_SUCCESS, args);

    // After apply mini app routes, i must to force next(to)
    // instead of next(). next() do nothing... bug???
    next && to && next(to);
    return true
  };

  /**
   * handleError
   * @param {Error|string} error
   */
  var handleError = function (error) {
    setAppStatus(name, FAILED);
    // error-first like node?! 😊
    createError(error, '', LOAD_ERROR_HAPPENED, name, args);

    next && next(false); // stop navigating to next route
  };

  /**
   * vue-mfe v2.0 不再由上层执行 AppEntry 的代码，改由子应用内部自己
   * 调用工厂方法 createSubApp 传入配置，再完成后续的一系列初始化工作
   */
  return (
    load(name)
      .then(function (module) { return installModule(module, name); })
      // .then((routes) => installAppModule(routes, name))
      .then(handleSuccess)
      .catch(handleError)
  )
};

/**
 * installModule
 * @param {Module&Route&Route[]} module
 * @param {string} [name]
 */
function installModule(module, name) {
  if (isObject(module) && isRoute(module)) {
    return getRouter().addRoutes([module])
  }

  if (isArray(module) && module.every(isRoute)) {
    return getRouter().addRoutes(module)
  }

  var entry = resolveModule(module);
  var ref = getConfig();
  var globalParentPath = ref.parentPath;

  // 不再向前兼容，如果导出的是 `export default function initSubApp(rootApp): Route[] {}`
  if (isObject(entry)) {
    // 最新API，导出的是 `export default createSubApp({ init: Function, routes: Route[], parentPath: string })`
    var init = entry.init;
    var routes = entry.routes;
    var parentPath = entry.parentPath;

    return Promise.resolve(isFunction(init) && init(getRootApp())).then(function () {
      // @ts-ignore
      getRouter().addRoutes(routes, parentPath || globalParentPath);
    })
  } /* else if (isFunction(entry)) {
    return Promise.resolve(entry(getRootApp())).then((routes) => {
      // @ts-ignore
      getRouter().addRoutes(routes, globalParentPath)
    })
  } */ else {
    throw new Error(("\n      Cannot not found 'export default VueMfe.createSubApp({ prefix: " + name + ", routes: [] })' in '" + name + "/src/portal.entry.js'\n    "))
  }
}

/**
 * @description resolve module whether ES or CommandJS module
 * @typedef {{ default: *, [key: string]: * }} Module
 * @param {Module} module
 * @returns {Module&Function}
 */
var resolveModule = function (module) { return (module && module.default) || module; };

/**
 * getAppPrefix
 * @param {string|{}|*} refOrStr
 */
function getAppPrefix(refOrStr) {
  if (isString(refOrStr)) {
    return getFirstWord(refOrStr)
  }

  if (isObject(refOrStr)) {
    return refOrStr.prefix
  }
}

/**
 * getFirstWord
 * @param {string} str
 * @param {string} [delimiter]
 */
var getFirstWord = function (str, delimiter) {
    if ( delimiter === void 0 ) delimiter = '/';

    return str
    .split(delimiter)
    .map(function (s) { return s.trim(); })
    .filter(Boolean)
    .shift();
};

/**
 * Lazy
 * @description 解析传入的名称获取应用前缀，懒加载应用并返回解析后的 module 内部变量
 * @tutorial
 *  1. 远程组件内部必须自包含样式
 *  2. 远程组件同样支持分片加载
 *  3. 可以引入所有被暴露的模块
 * @param {string} url appName+delimiter+[moduleName?]+componentName
 * @param {string} [delimiter] 分隔符
 * @example 引入特定 appName 应用下特定 moduleName 下特定 componentName
 *  ```js
 *    const LazyComponent = VueMfe.lazy('appName.moduleName.componentName')
 *  ```
 * @example 引入 workflow 下入口文件暴露出的 FlowLayout 组件，wf 为 appName，FlowLayout 为 portal.entry.js module 暴露出的变量
 *  ```js
 *    const FlowLayout = VueMfe.lazy('wf.components.FlowLayout')
 *  ```
 */
function Lazy(url, delimiter) {
  if ( delimiter === void 0 ) delimiter = '.';

  if (!getConfig()) {
    throw new Error(
      'Before you call `VueMfe.Lazy(url: string)` must set its config by `VueMfe.Lazy.setConfig({ resource: Resource[] })`'
    )
  }

  var appName = getFirstWord(url, delimiter);
  var keyPath = url.slice(appName.length + delimiter.length);

  return (
    appName &&
    load(appName).then(function (module) {
      var component = getPropVal(resolveModule(module), keyPath);

      if (isFunction(component)) {
        return component()
      } else {
        return component
      }
    })
  )
}

Lazy.setConfig = function(config) {
  return registerApp(config)
};

/**
 * getPropVal
 * @param {Object} obj
 * @param {string} key
 */
var getPropVal = function (obj, key) {
  return key.split('.').reduce(function (o, k) {
    return o[k]
  }, obj)
};

/**
 * Expose `pathToRegexp`.
 */
var parse_1 = parse;
var tokensToRegExp_1 = tokensToRegExp;

/**
 * Default configs.
 */
var DEFAULT_DELIMITER = '/';

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // ":test(\\d+)?" => ["test", "\d+", undefined, "?"]
  // "(\\d+)"  => [undefined, undefined, "\d+", undefined]
  '(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?'
].join('|'), 'g');

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string}  str
 * @param  {Object=} options
 * @return {!Array}
 */
function parse (str, options) {
  var tokens = [];
  var key = 0;
  var index = 0;
  var path = '';
  var defaultDelimiter = (options && options.delimiter) || DEFAULT_DELIMITER;
  var whitelist = (options && options.whitelist) || undefined;
  var pathEscaped = false;
  var res;

  while ((res = PATH_REGEXP.exec(str)) !== null) {
    var m = res[0];
    var escaped = res[1];
    var offset = res.index;
    path += str.slice(index, offset);
    index = offset + m.length;

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1];
      pathEscaped = true;
      continue
    }

    var prev = '';
    var name = res[2];
    var capture = res[3];
    var group = res[4];
    var modifier = res[5];

    if (!pathEscaped && path.length) {
      var k = path.length - 1;
      var c = path[k];
      var matches = whitelist ? whitelist.indexOf(c) > -1 : true;

      if (matches) {
        prev = c;
        path = path.slice(0, k);
      }
    }

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path);
      path = '';
      pathEscaped = false;
    }

    var repeat = modifier === '+' || modifier === '*';
    var optional = modifier === '?' || modifier === '*';
    var pattern = capture || group;
    var delimiter = prev || defaultDelimiter;

    tokens.push({
      name: name || key++,
      prefix: prev,
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      pattern: pattern
        ? escapeGroup(pattern)
        : '[^' + escapeString(delimiter === defaultDelimiter ? delimiter : (delimiter + defaultDelimiter)) + ']+?'
    });
  }

  // Push any remaining characters.
  if (path || index < str.length) {
    tokens.push(path + str.substr(index));
  }

  return tokens
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$/()])/g, '\\$1')
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {string}
 */
function flags (options) {
  return options && options.sensitive ? '' : 'i'
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {!Array}  tokens
 * @param  {Array=}  keys
 * @param  {Object=} options
 * @return {!RegExp}
 */
function tokensToRegExp (tokens, keys, options) {
  options = options || {};

  var strict = options.strict;
  var start = options.start !== false;
  var end = options.end !== false;
  var delimiter = options.delimiter || DEFAULT_DELIMITER;
  var endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|');
  var route = start ? '^' : '';

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];

    if (typeof token === 'string') {
      route += escapeString(token);
    } else {
      var capture = token.repeat
        ? '(?:' + token.pattern + ')(?:' + escapeString(token.delimiter) + '(?:' + token.pattern + '))*'
        : token.pattern;

      if (keys) { keys.push(token); }

      if (token.optional) {
        if (!token.prefix) {
          route += '(' + capture + ')?';
        } else {
          route += '(?:' + escapeString(token.prefix) + '(' + capture + '))?';
        }
      } else {
        route += escapeString(token.prefix) + '(' + capture + ')';
      }
    }
  }

  if (end) {
    if (!strict) { route += '(?:' + escapeString(delimiter) + ')?'; }

    route += endsWith === '$' ? '$' : '(?=' + endsWith + ')';
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === 'string'
      ? endToken[endToken.length - 1] === delimiter
      : endToken === undefined;

    if (!strict) { route += '(?:' + escapeString(delimiter) + '(?=' + endsWith + '))?'; }
    if (!isEndDelimited) { route += '(?=' + escapeString(delimiter) + '|' + endsWith + ')'; }
  }

  return new RegExp(route, flags(options))
}

function findMatchedName(map, key) {
  // all names array
  var keys = Object.keys(map);

  if (keys) {
    /** @type {RegExp[]} */
    var regexps = keys.map(function (key) { return tokensToRegExp_1(parse_1(key)); });
    var i = 0;
    var l = regexps.length;

    while (i++ < l) {
      var regexp = regexps[i];

      if (regexp.test(key)) {
        return keys[i]
      }
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
  if (parentPath === '/') {
    if (path !== '/') {
      return ensurePathSlash(path)
    } else {
      return parentPath
    }
  } else {
    return ensurePathSlash(parentPath) + ensurePathSlash(path)
  }
}

/**
 * ensurePathSlash
 * @param {string} path
 */
function ensurePathSlash(path) {
  var trailingSlashRE = /\/?$/;
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

var appMap = {};

var registerChildren = function (apps, path) {
  if (apps) {
    ([].concat(apps)).forEach(function (app) {
      if (typeof app === 'object') {
        var appKeys = Object.keys(app);
        appKeys.forEach(function (appName) {
          var appPath = app[appName];

          appMap[completePath(appPath, path)] = appName;
        });
      } else {
        appMap[completePath(app, path)] = name;
      }
    });
  }
};

function installChildren(children, args) {
  var next = args.next;
  var to = args.to;
  var name = args.name;

  return installApps(children)
    .then(function (success) { return success && next && to && next(to); })
    .catch(function (error) {
      // eslint-disable-next-line no-console
      createError(error, '', LOAD_ERROR_HAPPENED, name, args);
    })
}

var getChildrenApp = function (path) {
  var apps = appMap[path];

  /**
   * 需要处理这种情况的路径例： ‘/path/:var’，'/wf/:projectSysNo/form/design'
   * 路径不是固定 string ‘/a/b’，所以无法直接通过 {key: val} 映射得到对应的结果
   * 因此引入了 pathToRegExp 这个 lib 来处理这种情况，如果 reg.test(path)
   * 则认为匹配成功
   */
  if (!apps) {
    var key = findMatchedName(appMap, path);

    if (key) {
      apps = appMap[key];
    }
  }

  if (apps) {
    return [].concat(apps)
  }

  return null
};

var installApps = function (apps) {
  var promises = apps.map(function (name) { return install$1({ name: name }); });

  return Promise.all(promises).then(function (res) {
    return res.every(Boolean)
  })
};

var pathList = [];
var pathMap = {};

var pathExists = function (path) {
  return pathList.includes(path)
};

var nameExists = function (name) {
  return pathMap[name]
};

var genParentPath = function (path, parentPath, name) {
  if (pathExists(parentPath)) {
    return (path = completePath(path, parentPath))
  } else {
    warn(
      ("Cannot found the parent path " + parentPath + " " + (name ? 'of ' + name : '') + " in router")
    );
    return ''
  }
};

/**
 * @description DFS 刷新路径 pathList 和 pathMap 并检查路由 path 和 name 是否重复
 * @typedef {import('../../index').Route} Route
 * @param {Array<Route>} routes
 * @param {String} [parentPath]
 *  1. from method calls: addRoutes(routes, parentPath)
 *  2. from route property: { path: '/bar', parentPath: '/foo', template: '<a href="/foo/bar">/foo/bar</a>' }
 */
function refresh(routes, parentPath) {
  routes.forEach(
    function (ref) {
      var path = ref.path;
      var selfParentPath = ref.parentPath;
      var name = ref.name;
      var children = ref.children;
      var childrenApps = ref.childrenApps;

      /* 优先级 route.parentPath > VueMfe.SubAppConfig.parentPath >
      VueMfe.AppConfig.parentPath > VueMfe.defaultConfig.parentPath */

      if (path) {
        if (selfParentPath) {
          path = genParentPath(path, selfParentPath, name);
        } else if (parentPath) {
          path = genParentPath(path, parentPath, name);
        }
      }

      if (path) {
        if (!pathExists(path)) {
          pathList.push(path);
        } else {
          warn(("The path " + path + " in pathList has been existed"));
        }
      }

      if (name) {
        if (!nameExists(name)) {
          pathMap[name] = path;
        } else {
          warn(("The name " + name + " in pathMap has been existed"));
        }
      }

      // if childrenApps exists records it with its fullPath
      registerChildren(childrenApps, path);

      if (children && children.length) {
        // @ts-ignore
        return refresh(children, path)
      }
    }
  );

  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(pathList);
    // eslint-disable-next-line no-console
    console.log(pathMap);
  }
}

function objectWithoutProperties (obj, exclude) { var target = {}; for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1) target[k] = obj[k]; return target; }

/**
 * @typedef {import('../../index').Router} Router
 * @typedef {import('../../index').Route} Route
 */

/**
 * addRoutes
 * @description Add new routes into current router, and supports dynamic nest
 * @see
 *  + [Dynamically add child routes to an existing route](https://github.com/vuejs/vue-router/issues/1156)
 *  + [Feature request: replace routes dynamically](https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465)
 * @param {Array<Route>} newRoutes VueRoute route option
 * @param {string} [parentPath]
 * @param {Array<Route>} [oldRoutes]
 */
function addRoutes(newRoutes, parentPath, oldRoutes) {
  // before merge new routes we need to check them out does
  // any path or name whether duplicate in old routes
  refresh(newRoutes, parentPath);

  // reset current router's matcher with merged routes
  getRouter().matcher = new VueRouter(
    normalizeOptions(
      // @ts-ignore
      adaptRouterOptions(oldRoutes || getRouter()),
      { routes: newRoutes },
      parentPath
    )
    // @ts-ignore
  ).matcher;
}

/**
 * @param {Route[]|Router} routesOrRouter
 */
function adaptRouterOptions(routesOrRouter) {
  if (routesOrRouter) {
    if (routesOrRouter instanceof VueRouter) {
      return routesOrRouter.options
    } else if (isArray(routesOrRouter)) {
      return { routes: routesOrRouter }
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
function normalizeOptions(oldOpts, newOpts, parentPath) {
  var oldRoutes = oldOpts.routes; if ( oldRoutes === void 0 ) oldRoutes = [];
  var rest = objectWithoutProperties( oldOpts, ["routes"] );
  var oldProps = rest;
  var newRoutes = newOpts.routes; if ( newRoutes === void 0 ) newRoutes = [];
  var rest$1 = objectWithoutProperties( newOpts, ["routes"] );
  var newProps = rest$1;

  return Object.assign(
    {
      routes: mergeRoutes(oldRoutes, newRoutes, parentPath)
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
function mergeRoutes(oldRoutes, newRoutes, parentPath) {
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
}

function isUnmatchableRoute(route) {
  if (route.name && nameExists(route.name)) {
    return false
  }

  if (pathExists(route.path)) {
    return false
  }

  return route.matched.length === 0
}

/**
 * registerHook
 * @param {import('vue-router').default} router
 */
function registerHook(router) {
  // 处理 none-matched route 并尝试去安装和调用
  router.beforeEach(function handleUnmatchableRoute(to, from, next) {
    // @ts-ignore
    if (isUnmatchableRoute(to)) {
      var prefix = getAppPrefix(to.fullPath || to.path);
      var args = { name: prefix, to: to, from: from, next: next };

      if (isInstalling(prefix)) {
        return
      }

      if (isInstalled(prefix)) {
        var children = getChildrenApp(to.fullPath || to.path);

        if (children && children.length) {
          return installChildren(children, args)
        } else {
          createError(
            null,
            (prefix + " has been installed but it has no any path like " + (to.path)),
            LOAD_DUPLICATE_WITHOUT_PATH,
            prefix,
            args
          );
        }
      } else {
        return install$1(args)
      }
    } else {
      return next()
    }
  });
}

/**
 * init 刷新路由映射同时注入路由 hook
 * @param {import('..').Router} router
 */
function init(router) {
  if (router.addRoutes !== addRoutes) {
    router.addRoutes = addRoutes.bind(router);
  }

  // @ts-ignore
  refresh(router.options.routes);
  registerHook(router);
}

var DEFAULT_CONFIG = {
  // 是否对大小写敏感 '/AuTh/uSEr' => '/auth/user'
  /** @type {boolean} */
  sensitive: false,

  // 默认的 parentPath => router.addRoutes(routes, parentPath)
  /** @type {string} */
  parentPath: '/',

  // 获取资源的配置函数，支持同步和异步
  /** @type {Object|Function} */
  resources: function () {
    throw new Error()
  }
};

/**
 * @typedef {import('vue-router').default} VueRouter
 * @typedef {import('vue-router').RouteConfig} VueRoute
 *
 * @typedef {Object} VueMfeRoute
 * @property {string} [parentPath] The nested parent path
 * @property {string|Array<string>} [childrenApps] The nested children apps or name array
 * @typedef {VueRoute & VueMfeRoute} Route
 *
 * @typedef {Object} VueMfeRouter
 * @property {import('vue-router').RouterOptions} [options]
 * @property {{}} [matcher]
 * @typedef {VueRouter & VueMfeRouter} Router
 *
 * @typedef AppConfig
 * @property {Router} router 主应用 VueRouter 根实例
 * @property {boolean} [sensitive] 是否对大小写敏感 '/AuTh/uSEr' => '/auth/user'
 * @property {string} [parentPath] default parent path
 * @property {Resources} resources 获取资源的配置函数，支持同步/异步的函数/对象

 * @typedef {Object<string, {}>|Object<string, string[]>|Object<string, {}[]>} RawResource
 * @typedef {RawResource & AppConfig & SubAppConfig} Resource
 *
 * @callback ResourcesFn
 * @returns {Resource|Resource[]|Promise<Resource>}
 * @typedef {ResourcesFn|Resource|Resource[]} Resources
 *
 * @param {AppConfig} config
 *
 * 1. 初始化路由，记录 rootApp
 * 2. 添加钩子，拦截无匹配路由
 * 3. 懒加载无匹配路由的 resources
 */
function createApp(config) {
  // At fist, set the global config with wildcard key '*'
  registerApp(Object.assign({}, DEFAULT_CONFIG, config));

  // Then enhance router and register before-hook to intercept unmatchable route
  init(config.router);
}

/**
 * createSubApp
 * @typedef {Object} SubAppConfig
 * @property {string} prefix 子应用被监听的路径前缀
 * @property {Route[]} routes 子应用需要被动态载入的路由
 * @property {string} [name] 子应用中文名称
 * @property {(app: Vue)=>boolean|Error|Promise<boolean|Error>} [init] 子应用初始化函数和方法
 * @property {string} [parentPath] 子应用注册的嵌套父路径
 * @property {Resources} [resources] 获取资源的配置函数，支持同步/异步的函数/对象
 * @property {string} [globalVar] 入口文件 app.umd.js 暴露出的全部变量名称
 * @property {Object<string, Function>} [components] 暴露出的所有组件
 *
 * @param {SubAppConfig} config
 *
 * 1. 安装子应用调用 createSubApp 方法
 * 2. 调用 registerApp 刷新内部的维护的 configMap
 * 3. 执行 SubApp 的 init(app) => void|boolean 方法，初始化项目的前置依赖
 * 4. 初始化成功后返回 success 并安装子应用路由
 * 5. next(to) 到具体的子路由，END
 */
function createSubApp(config) {
  // required property
  if (!config.prefix) {
    throw new Error(
      ("Missing property 'prefix: string' in config \n" + (JSON.stringify(config)))
    )
  }

  // required property
  if (!config.routes) {
    throw new Error(
      ("Missing property 'routes: Route[]' in config \n" + (JSON.stringify(config)))
    )
  }

  registerApp(config);

  return config
}

var VueMfe = {
  version: '1.0.8',
  Lazy: Lazy,
  createApp: createApp,
  createSubApp: createSubApp,
  isInstalled: isInstalled,
  pathExists: pathExists,
  nameExists: nameExists
};

// Auto install if it is not done yet and `window` has `Vue`.
// To allow users to avoid auto-installation in some cases,
if (
  /* eslint-disable-next-line no-undef */
  // @ts-ignore
  typeof window !== 'undefined' &&
  // @ts-ignore
  window.Vue &&
  // @ts-ignore
  (!window.VueMfe || window.VueMfe !== VueMfe)
) {
  // install VueMfe to global context
  // @ts-ignore
  window.VueMfe = VueMfe;
}

export default VueMfe;
export { createApp, createSubApp };
