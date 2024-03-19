import { expect, test } from 'vitest';
import { dummy } from './app.js';

test('does vitest work', () => {
  expect(dummy(2)).toBe(3);
});
