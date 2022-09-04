import { execaCommand } from 'execa'
import { detect } from './detect'
import type { DetectOptions } from './detect'
import type { Agent } from './agents'
import { remove } from './utils'

const DEBUG_SIGN = '?'

export interface RunnerContext {
  hasLock?: boolean
  cwd?: string
}

export type Runner = (
  agent: any,
  args: string[],
  ctx?: RunnerContext
) => Promise<string | undefined> | string | undefined

export async function runnerCli(fn: Runner, options?: DetectOptions) {
  const args = process.argv.slice(2).filter(Boolean) // 过滤空字符串
  try {
    await run(fn, args, options)
  }
  catch {
    process.exit(1)
  }
}

export async function run(fn: Runner, args: string[], options?: DetectOptions) {
  const isDebug = args.includes(DEBUG_SIGN)
  if (isDebug)
    remove(args, DEBUG_SIGN)

  const cwd = process.cwd()

  const agent = await detect({ ...options, cwd })

  const commond = await fn(agent as Agent, args)

  if (!commond)
    return

  if (isDebug) {
    console.log(commond)
    return
  }

  await execaCommand(commond, { stdio: 'inherit', encoding: 'utf-8', cwd })
}
