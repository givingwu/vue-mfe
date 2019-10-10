import { getRootApp, getAppName } from '../core/app/config'
import { LOAD_ERROR } from '../constants/EVENT_TYPE'
import { isDev } from '../utils/env'

export function createError(error, message, code, prefix, args) {
  if (!error) {
    if (!(error instanceof Error)) {
      error = new Error(`【${getAppName(prefix) || prefix}】：` + message)
    }

    // 如果非开发环境，将 ERROR 转换为普通对象，而非错误被抛出
    if (!isDev) {
      error = {
        code: error.code || code,
        message: error.message || message,
        stack: error.stack
      }
    }
  }

  if (code && !error.code) {
    error.code = code
  }

  if (prefix && !error.name) {
    error.name = prefix
  }

  getRootApp().$emit(LOAD_ERROR, error, args)
}
