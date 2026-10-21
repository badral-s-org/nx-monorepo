const encoder = new TextEncoder();

const fromBase64 = (base64: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));

const toB64 = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));

// Importing the key is relatively expensive, so keep it for the lifetime of the isolate.
let cachedKey: { superKey: string; key: Promise<CryptoKey> } | undefined;

const getKey = (superKey: string | undefined) => {
  if (!superKey) {
    throw new Error('SUPER_KEY is not configured');
  }

  if (cachedKey?.superKey !== superKey) {
    const raw = fromBase64(superKey);

    if (![16, 24, 32].includes(raw.byteLength)) {
      throw new Error(
        'SUPER_KEY must be a base64 encoded 128, 192 or 256 bit key',
      );
    }

    cachedKey = {
      superKey,
      key: crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
        'encrypt',
        'decrypt',
      ]),
    };
  }

  return cachedKey.key;
};

export const decryptSecret = async (
  superKey: string,
  { iv, secret }: { iv: string; secret: string },
) => {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv) },
    await getKey(superKey),
    fromBase64(secret),
  );

  return new TextDecoder().decode(decrypted);
};

export const encryptSecret = async (superKey: string, plaintext: string) => {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await getKey(superKey),
    encoder.encode(plaintext),
  );

  return {
    iv: toB64(iv),
    secret: toB64(ciphertext),
  };
};

export const sha256Hex = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};
