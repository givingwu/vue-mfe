import { getRootApp, getAppName } from '../core/app/config'
import { LOAD_ERROR } from '../constants/EVENT_TYPE'

export function createError(error, message, code, prefix, args) {
  if (!error || !(error instanceof Error)) {
    error = new Error(`【${getAppName(prefix) || prefix}】：` + message)
  }

  if (code && !error.code) {
    error.code = code
  }

  if (prefix && !error.name) {
    error.name = prefix
  }

  getRootApp().$emit(LOAD_ERROR, error, args)
}
