import { describe, it, expect } from 'vitest';

// Validation utilities that could be extracted from forms
const validation = {
  /**
   * Validate South African phone number
   * Format: +27XXXXXXXXX or 0XXXXXXXXX
   */
  isValidPhone: (phone: string): boolean => {
    const cleanPhone = phone.replace(/\s/g, '');
    return /^(\+27|0)[6-8][0-9]{8}$/.test(cleanPhone);
  },

  /**
   * Validate South African mobile number
   */
  isValidMobile: (phone: string): boolean => {
    const cleanPhone = phone.replace(/\s/g, '');
    return /^(\+27|0)[6-8][0-9]{8}$/.test(cleanPhone);
  },

  /**
   * Validate email address
   */
  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Validate South African ID number (13 digits)
   */
  isValidIdNumber: (id: string): boolean => {
    if (!/^\d{13}$/.test(id)) return false;

    // Luhn algorithm validation
    const digits = id.split('').map(Number);
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      let digit = digits[i];
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[12];
  },

  /**
   * Validate vehicle registration (South African format)
   */
  isValidVehicleReg: (reg: string): boolean => {
    const cleanReg = reg.replace(/\s/g, '').toUpperCase();
    // Common SA formats: XX 000 XX, XX 00 XX XX, etc.
    return /^[A-Z]{2,3}\s?\d{2,5}\s?[A-Z]{0,3}$/.test(cleanReg);
  },

  /**
   * Validate password strength
   */
  isStrongPassword: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * Validate South African postal code
   */
  isValidPostalCode: (code: string): boolean => {
    return /^\d{4}$/.test(code);
  },

  /**
   * Validate currency amount
   */
  isValidAmount: (amount: number): boolean => {
    return !isNaN(amount) && amount >= 0 && Number.isFinite(amount);
  },

  /**
   * Validate GPS coordinates
   */
  isValidCoordinates: (lat: number, lng: number): boolean => {
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      !(lat === 0 && lng === 0) // Reject origin
    );
  },

  /**
   * Sanitize HTML input
   */
  sanitizeHtml: (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },
};

describe('Phone Validation', () => {
  describe('isValidPhone', () => {
    it('accepts valid +27 format', () => {
      expect(validation.isValidPhone('+27821234567')).toBe(true);
      expect(validation.isValidPhone('+27721234567')).toBe(true);
      expect(validation.isValidPhone('+27611234567')).toBe(true);
    });

    it('accepts valid 0 format', () => {
      expect(validation.isValidPhone('0821234567')).toBe(true);
      expect(validation.isValidPhone('0721234567')).toBe(true);
    });

    it('handles spaces', () => {
      expect(validation.isValidPhone('082 123 4567')).toBe(true);
      expect(validation.isValidPhone('+27 82 123 4567')).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(validation.isValidPhone('12345')).toBe(false);
      expect(validation.isValidPhone('+27111234567')).toBe(false); // Invalid prefix
      expect(validation.isValidPhone('+44821234567')).toBe(false); // Wrong country
      expect(validation.isValidPhone('')).toBe(false);
    });
  });
});

describe('Email Validation', () => {
  describe('isValidEmail', () => {
    it('accepts valid emails', () => {
      expect(validation.isValidEmail('test@example.com')).toBe(true);
      expect(validation.isValidEmail('user.name@domain.co.za')).toBe(true);
      expect(validation.isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('rejects invalid emails', () => {
      expect(validation.isValidEmail('invalid')).toBe(false);
      expect(validation.isValidEmail('no@domain')).toBe(false);
      expect(validation.isValidEmail('@nodomain.com')).toBe(false);
      expect(validation.isValidEmail('')).toBe(false);
    });
  });
});

describe('ID Number Validation', () => {
  describe('isValidIdNumber', () => {
    it('accepts valid ID number format', () => {
      // Note: This is a test number, actual validation would need Luhn check
      expect(validation.isValidIdNumber('8001015009087')).toBe(true);
    });

    it('rejects invalid ID numbers', () => {
      expect(validation.isValidIdNumber('123456789')).toBe(false); // Too short
      expect(validation.isValidIdNumber('12345678901234')).toBe(false); // Too long
      expect(validation.isValidIdNumber('123456789012A')).toBe(false); // Contains letter
    });
  });
});

describe('Password Validation', () => {
  describe('isStrongPassword', () => {
    it('accepts strong passwords', () => {
      const result = validation.isStrongPassword('Test@123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects short passwords', () => {
      const result = validation.isStrongPassword('Abc@1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('requires uppercase', () => {
      const result = validation.isStrongPassword('test@123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('requires lowercase', () => {
      const result = validation.isStrongPassword('TEST@123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('requires number', () => {
      const result = validation.isStrongPassword('TestTest@');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('requires special character', () => {
      const result = validation.isStrongPassword('TestTest1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });
});

describe('GPS Coordinate Validation', () => {
  describe('isValidCoordinates', () => {
    // South Africa coordinates (roughly)
    it('accepts valid South African coordinates', () => {
      expect(validation.isValidCoordinates(-33.9249, 18.4241)).toBe(true); // Cape Town
      expect(validation.isValidCoordinates(-26.2041, 28.0473)).toBe(true); // Johannesburg
      expect(validation.isValidCoordinates(-29.8587, 31.0218)).toBe(true); // Durban
    });

    it('accepts edge coordinates', () => {
      expect(validation.isValidCoordinates(90, 180)).toBe(true);
      expect(validation.isValidCoordinates(-90, -180)).toBe(true);
    });

    it('rejects out of range coordinates', () => {
      expect(validation.isValidCoordinates(91, 0)).toBe(false);
      expect(validation.isValidCoordinates(0, 181)).toBe(false);
      expect(validation.isValidCoordinates(-91, 0)).toBe(false);
    });

    it('rejects origin (0,0)', () => {
      expect(validation.isValidCoordinates(0, 0)).toBe(false);
    });

    it('rejects NaN values', () => {
      expect(validation.isValidCoordinates(NaN, 28)).toBe(false);
      expect(validation.isValidCoordinates(-26, NaN)).toBe(false);
    });
  });
});

describe('Amount Validation', () => {
  describe('isValidAmount', () => {
    it('accepts valid amounts', () => {
      expect(validation.isValidAmount(0)).toBe(true);
      expect(validation.isValidAmount(99.99)).toBe(true);
      expect(validation.isValidAmount(1000000)).toBe(true);
    });

    it('rejects negative amounts', () => {
      expect(validation.isValidAmount(-1)).toBe(false);
      expect(validation.isValidAmount(-0.01)).toBe(false);
    });

    it('rejects invalid numbers', () => {
      expect(validation.isValidAmount(NaN)).toBe(false);
      expect(validation.isValidAmount(Infinity)).toBe(false);
    });
  });
});

describe('HTML Sanitization', () => {
  describe('sanitizeHtml', () => {
    it('escapes HTML entities', () => {
      expect(validation.sanitizeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('escapes ampersands', () => {
      expect(validation.sanitizeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('escapes quotes', () => {
      expect(validation.sanitizeHtml("It's a \"test\"")).toBe('It&#039;s a &quot;test&quot;');
    });

    it('handles empty string', () => {
      expect(validation.sanitizeHtml('')).toBe('');
    });
  });
});

describe('Postal Code Validation', () => {
  describe('isValidPostalCode', () => {
    it('accepts valid 4-digit postal codes', () => {
      expect(validation.isValidPostalCode('0001')).toBe(true);
      expect(validation.isValidPostalCode('8001')).toBe(true);
      expect(validation.isValidPostalCode('9999')).toBe(true);
    });

    it('rejects invalid postal codes', () => {
      expect(validation.isValidPostalCode('123')).toBe(false);
      expect(validation.isValidPostalCode('12345')).toBe(false);
      expect(validation.isValidPostalCode('abcd')).toBe(false);
    });
  });
});
