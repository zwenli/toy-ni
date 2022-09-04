import os from 'node:os'
import { execSync } from 'node:child_process'

export function remove<T>(arr: Array<T>, v: T) {
  const index = arr.indexOf(v)
  if (index > -1)
    arr.splice(index, 1)
  return arr
}

export function exclude<T>(arr: Array<T>, v: T) {
  return remove(arr.slice(), v)
}

export function cmdExists(cmd: string) {
  try {
    execSync(
      os.platform() === 'win32'
        ? `cmd /c "(help ${cmd} > nul || exit 0) && where ${cmd} > nul 2> nul"`
        : `commond -v ${cmd}`,
    )
    return true
  }
  catch {
    return false
  }
}
