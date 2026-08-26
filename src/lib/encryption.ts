import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const MASTER_KEY_HEX = process.env.APP_VAULT_KEY || process.env.CLERK_SECRET_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Derive consistent 32-byte key
function getEncryptionKey(): Buffer {
  return crypto.createHash('sha256').update(MASTER_KEY_HEX).digest();
}

export interface EncryptedPayload {
  encryptedText: string;
  iv: string;
  authTag: string;
}

export function encryptCredential(plainText: string): EncryptedPayload {
  if (!plainText) {
    return { encryptedText: '', iv: '', authTag: '' };
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    encryptedText: encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

export function decryptCredential(encryptedText: string, ivHex: string, authTagHex?: string): string {
  if (!encryptedText || !ivHex) return '';

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    
    if (authTagHex) {
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    }

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt credential:', err);
    return '';
  }
}
