const encoder = new TextEncoder();

const fromBase64 = (base64: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(base64);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

export const toB64 = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)));

const base64Decode = (value: string): Uint8Array => {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
};

export const decryptSecret = async ({
  iv,
  secret,
}: {
  iv: string;
  secret: string;
}) => {
  const key = await crypto.subtle.importKey(
    'raw',
    base64Decode(process.env.SUPER_KEY!),
    {
      name: 'AES-GCM',
    },
    false,
    ['encrypt', 'decrypt'],
  );

  const ivBytes = fromBase64(iv);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    fromBase64(secret),
  );

  const value = new TextDecoder().decode(decrypted);

  return value;
};

export const encryptSecret = async (plaintext: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    base64Decode(process.env.SUPER_KEY!),
    {
      name: 'AES-GCM',
    },
    false,
    ['encrypt', 'decrypt'],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encoder.encode(plaintext),
  );

  return {
    iv,
    ciphertext,
  };
};
