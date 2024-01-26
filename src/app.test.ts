import { dummy } from './app';

describe('dummy', () => {
  test('does jest work', () => {
    expect(dummy(2)).toBe(3);
  });
});
