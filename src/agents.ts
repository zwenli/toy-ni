const npm = {
  ni: 'npm install',
}

const pnpm = {
  ni: 'pnpm install',
}

const yarn = {
  ni: 'yarn install',
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
