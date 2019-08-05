/**
 * @description lazy load style form a remote url then returns a promise
 * @param {String} url remote-url
 * @return {Promise}
 */
export function lazyloadStyle(url) {
  const link = document.createElement('link')

  link.type = 'text/css'
  link.rel = 'stylesheet'
  link.charset = 'utf-8'
  link.href = url
  link.setAttribute('force', false)

  return new Promise((resolve, reject) => {
    let timerId = setTimeout(() => clearState(true), 1.2e4)

    function clearState(isError) {
      clearTimeout(timerId)
      link.onerror = link.onload = link.onreadystatechange = null // 同时检查两种状态，只要有一种触发就删除事件处理器，避免触发两次

      isError && link && remove(link)
    }

    link.onload = function() {
      clearState()
      resolve(...arguments)
    }

    link.onerror = function() {
      clearState(true)
      reject(...arguments)
    }

    document.head.appendChild(link)
  })
}

/**
 * @description lazy load script form a remote url then returns a promise
 * @param {String} url remote-url
 * @param {String} globalVar global variable key
 * @return {Promise}
 */
export function lazyLoadScript(url, globalVar) {
  const script = document.createElement('script')

  script.type = 'text/javascript'
  script.charset = 'utf-8'
  script.src = url
  script.async = true
  script.setAttribute('nonce', 'nonce')

  return new Promise((resolve, reject) => {
    let timerId = setTimeout(
      () => onLoadFailed(`Reject script ${url}: LOAD_SCRIPT_TIMEOUT`),
      1.2e4
    )

    function clearState() {
      clearTimeout(timerId)
      script.onerror = script.onload = script.onreadystatechange = null // 同时检查两种状态，只要有一种触发就删除事件处理器，避免触发两次
      remove(script)
    }

    function onLoadSuccess() {
      clearState()
      resolve(globalVar ? window[globalVar] : undefined, ...arguments)
    }

    function onLoadFailed() {
      clearState()
      reject(...arguments)
    }

    if (script.readyState !== undefined) {
      // IE
      script.onreadystatechange = function change(evt) {
        if (
          (script.readyState === 'loaded' ||
            script.readyState === 'complete') &&
          (globalVar ? window[globalVar] : true)
        ) {
          onLoadSuccess()
        } else {
          onLoadFailed('Unknown error happened', evt)
        }
      }
    } else {
      // Others
      script.onload = onLoadSuccess
      script.onerror = function error(evt) {
        onLoadFailed(`GET ${url} net::ERR_CONNECTION_REFUSED`, evt)
      }
    }

    document.body.appendChild(script)
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
      ele.remove()
    } else {
      ele.parentNode.removeChild(ele)
    }
  }
}
