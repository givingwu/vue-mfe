export function retry(fn, retriesLeft = 3, interval = 0) {
  return new Promise((resolve, reject) => {
    return fn()
      .then(resolve)
      .catch((error) => {
        if (retriesLeft === 1) {
          // reject('maximum retries exceeded');
          reject(error)
          return
        }

        setTimeout(() => {
          // Passing on "reject" is the important part
          retry(fn, retriesLeft - 1, interval).then(resolve, reject)
        }, interval)
      })
  })
}
