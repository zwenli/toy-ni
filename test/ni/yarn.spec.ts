import { expect, test } from 'vitest'
import { parseNi } from '../../src/commands'

const agent = 'yarn'
const _ = (args: string, expected: string) => () => {
  expect(parseNi(agent, args.split(' ').filter(Boolean))).toBe(expected)
}

test('empty install', _('', 'yarn i'))

test('single add', _('axios', 'yarn add axios'))

test('multiple', _('eslint @types/node', 'yarn add eslint @types/node'))

test('-D', _('-D eslint @types/node', 'yarn add -D eslint @types/node'))

test('global', _('-g axios', 'yarn global add axios'))
