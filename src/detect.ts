import path from 'node:path'
import { findUp } from 'find-up'
import type { Agent } from './agents'
import { LOCKS } from './agents'
export interface DetectOptions {
  cwd?: string
}

export async function detect({ cwd }: DetectOptions) {
  let agent: Agent | null = null

  const lockPath = await findUp(Object.keys(LOCKS), { cwd })

  // 基于锁文件的探测
  if (lockPath)
    agent = LOCKS[path.basename(lockPath)]

  return agent
}
