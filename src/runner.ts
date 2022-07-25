export interface RunnerContext {
  hasLock?: boolean
  cwd?: string
}

export type Runner = (
  agent: any,
  args: string[],
  ctx?: RunnerContext
) => Promise<string | undefined> | string | undefined

export async function runnerCli(fn: Runner, options?: object) {
  const args = process.argv.slice(2)
  try {
    await run(fn, args, options)
  }
  catch {
    process.exit(1)
  }
}

export async function run(fn, args: string[], options?: object) {
  console.log(fn, args, options)
  return 'tst'
}
