const encoder = new TextEncoder();
const decoder = new TextDecoder();

const base64Encode = (data: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(data)));
};

const base64Decode = (value: string): Uint8Array => {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
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
