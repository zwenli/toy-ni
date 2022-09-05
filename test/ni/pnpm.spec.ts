import { expect, test } from 'vitest'
import { parseNi } from '../../src/commands'

const agent = 'pnpm'
const _ = (args: string, expected: string) => () => {
  expect(parseNi(agent, args.split(' ').filter(Boolean))).toBe(expected)
}

test('empty install', _('', 'pnpm i'))

test('single add', _('axios', 'pnpm add axios'))

test('multiple', _('eslint @types/node', 'pnpm add eslint @types/node'))

test('-D', _('-D eslint @types/node', 'pnpm add -D eslint @types/node'))

test('global', _('-g axios', 'pnpm add -g axios'))
