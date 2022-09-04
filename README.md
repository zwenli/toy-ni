## about

对 [@antfu/ni](https://github.com/antfu/ni) 项目的学习，最小实现

## 源码解读

先查看 package.json 文件的 scripts 部分
```json
{
  "scripts": {
    "prepublishOnly": "npm run build",
    "dev": "esno src/commands/ni.ts",
    "build": "unbuild",
    "stub": "unbuild --stub",
    "release": "bumpp && npm publish",
    "lint": "eslint .",
    "test": "vitest"
  }
}
```
从 `dev` 命令中找到入口文件 'src/commands/ni.ts'，从这里开始分析

### src/commands/ni.ts
ni.ts 文件存放在 commands 目录下，顾名思义，目录下都是相关命令，ni.ts 就是对应的`ni`命令

```ts
import { parseNi } from '../parse'
import { runnerCli } from '../runner'

runnerCli(parseNi)
```

逻辑很简单，parseNi 函数用来解析 `ni` 命令的，runnerCli 是命令行的启动器，这里将 parseNi 当作参数传入函数中并执行

### runnerCli - 主流程，启动器

```ts
export async function runnerCli(fn: Runner, options?: object) {
  // process.argv 第一个参数指node可执行文件，第二个参数指被执行文件，这两个参数直接过滤掉
  const args = process.argv.slice(2).filter(Boolean) // 过滤空字符串
  try {
    await run(fn, args, options)
  }
  catch {
    // process.exit 用来退出当前进程。函数接受一个数值，0表示执行成功，大于0则表示执行失败
    process.exit(1)
  }
}
```
runnerCli 的逻辑很简单，就是对终端传入的命令行参数做一次解析。最终执行 run 函数

### run - 主流程，真正执行的地方

```ts
// 省略代码部分
import execa from 'execa'
const DEBUG_SIGN = '?'
export async function run(fn: Runner, args: string[], options: DetectOptions = {}) {
  // 命令行参数包含 ? 符号，说明是 调试模式，不执行脚本
  const debug = args.includes(DEBUG_SIGN)
  if (debug)
    // 调试模式下，删除 ? 符号
    remove(args, DEBUG_SIGN)

  // cwd 函数返回进程的当前工作目录，绝对路径
  let cwd = process.cwd()
  let command

  // 支持改变目录（Change Directory） -C dir
  // ni -C package/foo vite
  if (args[0] === '-C') {
    cwd = resolve(cwd, args[1])
    // 删除对应的两个参数 `-C package/foo`
    args.splice(0, 2)
  }

  // 全局参数，
  const isGlobal = args.includes('-g')
  if (isGlobal) {
    // 全局参数下，使用全局的包管理工具
    command = await fn(await getGlobalAgent(), args)
  }
  else {
    // 根据锁文件猜测使用哪个包管理工具，如果没有锁文件，会返回null
    // 则调用 getDefaultAgent 函数，获取默认 包管理工具， 默认返回 'prompt'，让用户选择
    let agent = await detect({ ...options, cwd }) || await getDefaultAgent()
    if (agent === 'prompt') {
      agent = (await prompts({
        name: 'agent',
        type: 'select',
        message: 'Choose the agent',
        choices: agents.filter(i => !i.includes('@')).map(value => ({ title: value, value })),
      })).agent
      // 若用户没选择包管理工具，直接返回
      if (!agent)
        return
    }
    // fn 即是 解析命令的函数 parseXX,
    command = await fn(agent as Agent, args, {
      hasLock: Boolean(agent),
      cwd,
    })
  }

  // 如果没有命令，直接返回
  if (!command)
    return

  const voltaPrefix = getVoltaPrefix()
  if (voltaPrefix)
    command = voltaPrefix.concat(' ').concat(command)

  // 如果是调试模式，直接打印出命令
  if (debug) {

    console.log(command)
    return
  }

  // 最终使用 execa 库的 execaCommand 函数执行命令
  await execaCommand(command, { stdio: 'inherit', encoding: 'utf-8', cwd })
}
```

run 函数主要做了三件事
1. 根据锁文件猜测使用哪个包管理工具，detect 函数
2. 解析命令，抹平不同包管理工具的命令差异，parseNi 函数
3. 最终执行相应的命令，execaCommand 工具


### detect - 根据锁文件猜测使用哪个包管理工具
```ts
export async function detect({ autoInstall, cwd }: DetectOptions) {
  let agent: Agent | null = null

  // 找到项目目录下的锁文件，findUp 函数回按照数组的顺序返回第一个匹配的文件路径（优先级）
  const lockPath = await findUp(Object.keys(LOCKS), { cwd })
  let packageJsonPath: string | undefined

  // 找到 package.json 文件
  if (lockPath)
    packageJsonPath = path.resolve(lockPath, '../package.json')
  else
    packageJsonPath = await findUp('package.json', { cwd })

  // read `packageManager` field in package.json
  // 支持在package.json的 `packageManager` 指定包管理工具
  if (packageJsonPath && fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      if (typeof pkg.packageManager === 'string') {
        const [name, version] = pkg.packageManager.split('@')
        if (name === 'yarn' && parseInt(version) > 1)
          agent = 'yarn@berry'
        else if (name === 'pnpm' && parseInt(version) < 7)
          agent = 'pnpm@6'
        else if (name in AGENTS)
          agent = name
        else
          console.warn('[ni] Unknown packageManager:', pkg.packageManager)
      }
    }
    catch {}
  }

  // detect based on lock
  // `packageManager` 的优先级高于锁文件，
  // 前者没设置，再根据锁文件确定包管理工具
  if (!agent && lockPath)
    agent = LOCKS[path.basename(lockPath)]

  // auto install
  if (agent && !cmdExists(agent.split('@')[0])) {
    if (!autoInstall) {
      console.warn(`[ni] Detected ${agent} but it doesn't seem to be installed.\n`)

      if (process.env.CI)
        process.exit(1)

      const link = terminalLink(agent, INSTALL_PAGE[agent])
      const { tryInstall } = await prompts({
        name: 'tryInstall',
        type: 'confirm',
        message: `Would you like to globally install ${link}?`,
      })
      if (!tryInstall)
        process.exit(1)
    }

    await execaCommand(`npm i -g ${agent}`, { stdio: 'inherit', cwd })
  }

  return agent
}
```
detect 函数主要做了以下事情
1. 找到项目目录下的锁文件，package.json 文件
2. 若package.json定义了`packageManager`, 则确定使用对应包管理管理
3. 若没定义，则通过锁文件确定包管理管理
4. 若都没有找到，返回null
5. 如果找到包管理工具了，若用户电脑是有这个命令，则询问是否自动安装


### parseNi - 解析ni命令，抹平不同包管理工具的命令差异

```ts
export const parseNi = <Runner>((agent, args, ctx) => {
  // ni -v 输出版本号
  if (args.length === 1 && args[0] === '-v') {

    console.log(`@antfu/ni v${version}`)
    process.exit(0)
  }

  // bun use `-d` instead of `-D`, #90
  if (agent === 'bun')
    args = args.map(i => i === '-D' ? '-d' : i)

  // global 参数处理
  if (args.includes('-g'))
    return getCommand(agent, 'global', exclude(args, '-g'))

  if (args.includes('--frozen-if-present')) {
    args = exclude(args, '--frozen-if-present')
    return getCommand(agent, ctx?.hasLock ? 'frozen' : 'install', args)
  }

  if (args.includes('--frozen'))
    return getCommand(agent, 'frozen', exclude(args, '--frozen'))

  // 没有参数，或者所有参数都是以 - 开头，匹配install命令
  // npm i, yarn i, pnpm i,
  if (args.length === 0 || args.every(i => i.startsWith('-')))
    return getCommand(agent, 'install', args)

  // 匹配add 命令
  return getCommand(agent, 'add', args)
})
```

通过 getCommand 获取命令
```ts
// 节选
// 配置，不同管理器的命令
// 配置实际存放在 agents.ts 文件中
AGENTS = {
  npm: {
    install: 'npm i'
  },
  yarn: {
    install: 'yarn i'
  },
  pnpm: {
    install: 'pnpm i'
  }
}
//

export function getCommand(
  agent: Agent,
  command: Command,
  args: string[] = [],
) {
  // 包管理不在 AGENTS 中则报错
  if (!(agent in AGENTS))
    throw new Error(`Unsupported agent "${agent}"`)

  // 获取对应命令
  const c = AGENTS[agent][command]

  // 如果是函数，则执行函数
  if (typeof c === 'function')
    return c(args)

  // 命令不存在，报错
  if (!c)
    throw new Error(`Command "${command}" is not support by agent "${agent}"`)
  // 拼接参数，替换占位符，最后输出拼接后的命令字符串
  return c.replace('{0}', args.join(' ')).trim()
}
```

## 相关库说明

* tsx: 等同 ts-node, 用来直接运行ts文件的工具
* unbuild: 打包工具，支持打包ts并生成 commonjs 和 es module 模块格式 + 类型声明
* find-up: 遍历父目录查找文件/目录的工具
* terminalLink: 生产命令行链接的工具
* execa: 改进 child_process 函数的工具