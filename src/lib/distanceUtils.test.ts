import { describe, it, expect } from 'vitest';
import { calculateDistance, isWithinDeliveryRadius, formatTime } from './distanceUtils';

describe('calculateDistance', () => {
  it('calculates distance between two points correctly', () => {
    // Cape Town to Johannesburg (approximately 1400 km)
    const distance = calculateDistance(
      -33.9249, 18.4241, // Cape Town
      -26.2041, 28.0473  // Johannesburg
    );
    expect(distance).toBeGreaterThan(1200);
    expect(distance).toBeLessThan(1500);
  });

  it('returns 0 for same location', () => {
    const distance = calculateDistance(
      -33.9249, 18.4241,
      -33.9249, 18.4241
    );
    expect(distance).toBe(0);
  });

  it('handles negative coordinates', () => {
    const distance = calculateDistance(
      -33.9249, 18.4241,
      -34.0000, 18.5000
    );
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(20); // Should be less than 20km
  });
});

describe('isWithinDeliveryRadius', () => {
  it('returns true when within radius', () => {
    const result = isWithinDeliveryRadius(
      -33.9249, 18.4241, // Restaurant in Cape Town
      -33.9300, 18.4300, // Nearby delivery address
      10 // 10km radius
    );
    expect(result.isWithinRadius).toBe(true);
    expect(result.distance).toBeLessThan(10);
  });

  it('returns false when outside radius', () => {
    const result = isWithinDeliveryRadius(
      -33.9249, 18.4241, // Restaurant in Cape Town
      -26.2041, 28.0473, // Johannesburg (far away)
      50 // 50km radius
    );
    expect(result.isWithinRadius).toBe(false);
    expect(result.distance).toBeGreaterThan(50);
  });

  it('returns exact boundary correctly', () => {
    const result = isWithinDeliveryRadius(
      0, 0,
      0.089932, 0, // Approximately 10km at equator
      10
    );
    expect(result.distance).toBeCloseTo(10, 0);
  });
});

describe('formatTime', () => {
  it('formats morning time correctly', () => {
    expect(formatTime('09:00')).toBe('9:00 AM');
    expect(formatTime('08:30')).toBe('8:30 AM');
  });

  it('formats afternoon time correctly', () => {
    expect(formatTime('14:00')).toBe('2:00 PM');
    expect(formatTime('15:30')).toBe('3:30 PM');
  });

  it('formats noon correctly', () => {
    expect(formatTime('12:00')).toBe('12:00 PM');
  });

  it('formats midnight correctly', () => {
    expect(formatTime('00:00')).toBe('12:00 AM');
  });

  it('formats evening time correctly', () => {
    expect(formatTime('21:00')).toBe('9:00 PM');
    expect(formatTime('23:59')).toBe('11:59 PM');
  });
});
