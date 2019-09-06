import { completePath } from '../../utils/path'
import { warn } from '../../utils/index'

export const pathList = []
export const pathMap = {}

export const pathExists = (path) => {
  return pathList.includes(path)
}

export const nameExists = (name) => {
  return pathMap[name]
}

export const genParentPath = (path, parentPath, name) => {
  if (pathExists(parentPath)) {
    return (path = completePath(path, parentPath))
  } else {
    warn(
      `Cannot found the parent path ${parentPath} ${
        name ? 'of ' + name : ''
      } in router`
    )
    return ''
  }
}
