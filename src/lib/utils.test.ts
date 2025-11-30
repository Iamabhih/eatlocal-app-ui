import { describe, it, expect } from 'vitest';
import { cn, formatCurrency } from './utils';

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active', false && 'inactive')).toBe('base active');
  });

  it('merges tailwind classes properly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('handles arrays', () => {
    expect(cn(['px-2', 'py-1'])).toBe('px-2 py-1');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(undefined, null)).toBe('');
  });
});

describe('formatCurrency function', () => {
  it('formats ZAR currency correctly', () => {
    const result = formatCurrency(100);
    expect(result).toContain('100');
    expect(result).toContain('R');
  });

  it('formats with decimal places', () => {
    const result = formatCurrency(99.99);
    expect(result).toContain('99');
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('handles large numbers', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('000');
  });

  it('formats with custom currency', () => {
    const result = formatCurrency(100, 'USD');
    expect(result).toContain('100');
  });
});
