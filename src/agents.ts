const npm = {
  install: 'npm i {0}',
  add: 'npm i {0}',
  global: 'npm i -g {0}',
}

const pnpm = {
  install: 'pnpm i {0}',
  add: 'pnpm add {0}',
  global: 'pnpm add -g {0}',
}

const yarn = {
  install: 'yarn i {0}',
  add: 'yarn add {0}',
  global: 'yarn global add {0}',
}

export const AGENTS = {
  npm,
  pnpm,
  yarn,
}

export type Agent = keyof typeof AGENTS
export type Command = keyof typeof AGENTS.npm

export const agents = Object.keys(AGENTS) as Agent[]

export const LOCKS: Record<string, Agent> = {
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'package-lock.json': 'npm',
}

export const INSTALL_PAGE: Record<Agent, string> = {
  pnpm: 'https://pnpm.js.org/en/installation',
  yarn: 'https://classic.yarnpkg.com/en/docs/install',
  npm: 'https://www.npmjs.com/get-npm',
}
