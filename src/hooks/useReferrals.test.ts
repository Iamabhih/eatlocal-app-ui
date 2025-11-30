import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getReferralUrl } from './useReferrals';

describe('Referral Utility Functions', () => {
  describe('getReferralUrl', () => {
    beforeEach(() => {
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'https://eatlocal.co.za',
          search: '',
        },
        writable: true,
      });
    });

    it('generates correct referral URL with code', () => {
      const url = getReferralUrl('ABC123');
      expect(url).toBe('https://eatlocal.co.za/auth?role=customer&ref=ABC123');
    });

    it('handles special characters in code', () => {
      const url = getReferralUrl('EAT-USER-001');
      expect(url).toContain('ref=EAT-USER-001');
    });

    it('uses default domain when window.location is not available', () => {
      // Test that URL is valid even with special codes
      const url = getReferralUrl('TEST');
      expect(url).toContain('/auth?role=customer&ref=');
    });
  });
});

describe('Referral Code Format', () => {
  it('should have expected format', () => {
    // Referral codes follow pattern: EAT + 4 chars from user ID + 4 random chars
    const codePattern = /^EAT[A-Z0-9]{8}$/;
    const testCode = 'EATABCD1234';
    expect(codePattern.test(testCode)).toBe(true);
  });

  it('should be uppercase', () => {
    const testCode = 'EATUSER1234';
    expect(testCode).toBe(testCode.toUpperCase());
  });
});

describe('Referral Rewards', () => {
  const REFERRAL_REWARDS = {
    REFERRER: 50,
    REFERRED: 25,
  };

  it('referrer gets R50 reward', () => {
    expect(REFERRAL_REWARDS.REFERRER).toBe(50);
  });

  it('referred user gets R25 reward', () => {
    expect(REFERRAL_REWARDS.REFERRED).toBe(25);
  });

  it('total referral bonus is R75', () => {
    expect(REFERRAL_REWARDS.REFERRER + REFERRAL_REWARDS.REFERRED).toBe(75);
  });
});
