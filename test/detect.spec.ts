import { expect, test } from 'vitest'
import { detect } from '../src/detect'

const cwd = process.cwd()

test('detect pnpm', () => {
  expect(detect({ cwd })).resolves.toBe('pnpm')
})
