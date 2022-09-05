import { expect, test } from 'vitest'
import { getCommand } from '../src/commands'

test('wrong agent', () => {
  expect(() => {
    getCommand('wrong' as any, 'install', [])
  }).toThrow('Unsupported agent "wrong"')
})

test('unsupported command', () => {
  expect(() => {
    getCommand('npm', 'unsupported' as any, [])
  }).toThrow('Command "unsupported" is not support by agent "npm"')
})
