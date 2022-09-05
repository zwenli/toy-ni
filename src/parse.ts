import { version } from '../package.json'
import type { Runner } from './runner'
import type { Agent, Command } from './agents'
import { AGENTS } from './agents'
import { exclude } from './utils'

export function getCommand(agent: Agent, command: Command, args: string[] = []) {
  if (!(agent in AGENTS))
    throw new Error(`Unsupported agent "${agent}"`)

  const c = AGENTS[agent][command]

  // if (typeof c === 'function')
  //   return c(args)

  if (!c)
    throw new Error(`Command "${command}" is not support by agent "${agent}"`)

  return c.replace('{0}', args.join(' ')).trim()
}

// 解析 ni 指令
export const parseNi = <Runner>((agent, args) => {
  // version
  if (args.length === 1 && args[0] === '-v') {
    console.log(`@zwenli/toy-ni v${version}`)
    process.exit(0)
  }

  // global
  if (args.includes('-g'))
    return getCommand(agent, 'global', exclude(args, '-g'))

  // install
  if (args.length === 0 || args.every(i => i.startsWith('-')))
    return getCommand(agent, 'install', args)

  // add
  return getCommand(agent, 'add', args)
})
