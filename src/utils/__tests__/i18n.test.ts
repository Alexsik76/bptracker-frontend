import { describe, it, expect } from 'vitest';
import uk from '../../locales/uk';
import en from '../../locales/en';

function flatten(obj: any, prefix = ''): string[] {
  const keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      keys.push(...flatten(obj[k], path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

describe('locales', () => {
  it('en has the same keys as uk', () => {
    const ukKeys = flatten(uk).sort();
    const enKeys = flatten(en).sort();
    expect(enKeys).toEqual(ukKeys);
  });
});
