import crypto from 'crypto';

// Simple TOTP implementation without external dependencies
// Based on RFC 6238

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Generate a random base32 secret
export function generateSecret(length: number = 20): string {
  const buffer = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[buffer[i] % 32];
  }
  return secret;
}

// Decode base32 to buffer
function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.replace(/=+$/, '').toUpperCase();
  let bits = '';

  for (const char of cleaned) {
    const index = BASE32_CHARS.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }

  return Buffer.from(bytes);
}

// Generate HOTP value
function generateHOTP(secret: string, counter: number): string {
  const key = base32Decode(secret);

  // Convert counter to 8-byte buffer (big endian)
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  // Generate HMAC-SHA1
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const hash = hmac.digest();

  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0xf;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

// Generate current TOTP
export function generateTOTP(secret: string, window: number = 0): string {
  const counter = Math.floor(Date.now() / 30000) + window;
  return generateHOTP(secret, counter);
}

// Verify TOTP with time drift tolerance
export function verifyTOTP(secret: string, token: string, drift: number = 1): boolean {
  for (let i = -drift; i <= drift; i++) {
    if (generateTOTP(secret, i) === token) {
      return true;
    }
  }
  return false;
}

// Generate OTP Auth URI for QR code
export function generateOTPAuthURI(
  secret: string,
  accountName: string,
  issuer: string = 'Accuro'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// Generate backup codes
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code.slice(0, 4) + '-' + code.slice(4));
  }
  return codes;
}

// Hash backup code for storage
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.replace('-', '')).digest('hex');
}

// Verify backup code
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const hashed = hashBackupCode(code);
  return hashedCodes.indexOf(hashed);
}
