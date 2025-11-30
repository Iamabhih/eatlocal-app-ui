/**
 * RFC 6238 TOTP (Time-based One-Time Password) Implementation
 * Uses the Web Crypto API for cryptographically secure HMAC-SHA1
 */

// Base32 alphabet for encoding/decoding secrets
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decode a Base32-encoded string to Uint8Array
 */
function base32Decode(input: string): Uint8Array {
  const cleanInput = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const output = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleanInput.length; i++) {
    const index = BASE32_ALPHABET.indexOf(cleanInput[i]);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bits -= 8;
      output.push((value >> bits) & 0xff);
    }
  }

  return new Uint8Array(output);
}

/**
 * Generate a cryptographically secure Base32 secret
 */
export function generateSecret(length: number = 20): string {
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);

  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE32_ALPHABET[randomBytes[i] % 32];
  }

  // Add padding to ensure it's a multiple of 8
  while (result.length % 8 !== 0) {
    result += BASE32_ALPHABET[Math.floor(Math.random() * 32)];
  }

  return result;
}

/**
 * Generate cryptographically secure backup codes
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const randomBytes = new Uint8Array(count * 4);
  crypto.getRandomValues(randomBytes);

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code from 4 random bytes
    const value = (randomBytes[i * 4] << 24) |
                  (randomBytes[i * 4 + 1] << 16) |
                  (randomBytes[i * 4 + 2] << 8) |
                  randomBytes[i * 4 + 3];
    const code = Math.abs(value).toString(36).toUpperCase().slice(0, 8).padStart(8, '0');
    codes.push(code);
  }

  return codes;
}

/**
 * HMAC-SHA1 implementation using Web Crypto API
 */
async function hmacSha1(secret: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    secret as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, message as BufferSource);
  return new Uint8Array(signature);
}

/**
 * Convert a number to a big-endian 8-byte array
 */
function numberToBytes(num: number): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  // Set as 64-bit unsigned big-endian integer
  view.setUint32(0, Math.floor(num / 0x100000000));
  view.setUint32(4, num >>> 0);
  return new Uint8Array(buffer);
}

/**
 * Dynamic truncation according to RFC 4226
 */
function dynamicTruncate(hmacValue: Uint8Array): number {
  const offset = hmacValue[hmacValue.length - 1] & 0x0f;
  const code =
    ((hmacValue[offset] & 0x7f) << 24) |
    ((hmacValue[offset + 1] & 0xff) << 16) |
    ((hmacValue[offset + 2] & 0xff) << 8) |
    (hmacValue[offset + 3] & 0xff);
  return code;
}

/**
 * Generate a TOTP code
 * @param secret - Base32 encoded secret
 * @param timeStep - Time step in seconds (default: 30)
 * @param digits - Number of digits in OTP (default: 6)
 * @param timestamp - Timestamp to use (default: current time)
 */
export async function generateTOTP(
  secret: string,
  timeStep: number = 30,
  digits: number = 6,
  timestamp?: number
): Promise<string> {
  const time = timestamp ?? Math.floor(Date.now() / 1000);
  const counter = Math.floor(time / timeStep);

  const secretBytes = base32Decode(secret);
  const counterBytes = numberToBytes(counter);

  const hmac = await hmacSha1(secretBytes, counterBytes);
  const code = dynamicTruncate(hmac);

  const otp = (code % Math.pow(10, digits)).toString().padStart(digits, '0');
  return otp;
}

/**
 * Verify a TOTP code with window tolerance
 * @param secret - Base32 encoded secret
 * @param token - The OTP token to verify
 * @param window - Number of time steps to check before/after current (default: 1)
 * @param timeStep - Time step in seconds (default: 30)
 */
export async function verifyTOTP(
  secret: string,
  token: string,
  window: number = 1,
  timeStep: number = 30
): Promise<boolean> {
  const currentTime = Math.floor(Date.now() / 1000);

  // Check tokens within the window
  for (let i = -window; i <= window; i++) {
    const checkTime = currentTime + (i * timeStep);
    const expectedToken = await generateTOTP(secret, timeStep, 6, checkTime);

    // Constant-time comparison to prevent timing attacks
    if (constantTimeCompare(token, expectedToken)) {
      return true;
    }
  }

  return false;
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate OTPAuth URL for QR code
 * @param issuer - The issuer name (e.g., "EatLocal")
 * @param accountName - The account identifier (e.g., email)
 * @param secret - Base32 encoded secret
 */
export function generateOtpauthUrl(
  issuer: string,
  accountName: string,
  secret: string
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  const encodedSecret = encodeURIComponent(secret);

  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${encodedSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Validate that a token is in the correct format (6 digits)
 */
export function isValidTokenFormat(token: string): boolean {
  return /^\d{6}$/.test(token);
}

/**
 * Validate that a backup code is in the correct format
 */
export function isValidBackupCode(code: string): boolean {
  return /^[A-Z0-9]{6,10}$/i.test(code);
}
