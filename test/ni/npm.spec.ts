import { expect, test } from 'vitest'
import { parseNi } from '../../src/commands'

const agent = 'npm'
const _ = (args: string, expected: string) => () => {
  expect(parseNi(agent, args.split(' ').filter(Boolean))).toBe(expected)
}

test('empty install', _('', 'npm i'))

test('single add', _('axios', 'npm i axios'))

test('multiple', _('eslint @types/node', 'npm i eslint @types/node'))

test('-D', _('-D eslint @types/node', 'npm i -D eslint @types/node'))

test('global', _('-g axios', 'npm i -g axios'))
