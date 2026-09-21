/**
 * Optical Physical Action Protocol (OPAP) - Client-Side AES-256-GCM Encryption
 * Built with standard Web Crypto API (crypto.subtle). Zero external crypto dependencies.
 * Copyright 2026 AHM Labs Ltd. Licensed under Apache-2.0.
 */

import { packOpap, unpackOpap, uint8ArrayToBase64Url, base64UrlToUint8Array } from './packer.js';
import type { OpapAAT } from './ast.js';

const getSubtle = (): SubtleCrypto => {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API (crypto.subtle) is not supported in this runtime environment');
};

async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = getSubtle();
  const encoder = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 10000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function isEncryptedOpap(payload: string): boolean {
  const clean = payload.replace(/^#/, '').trim();
  return clean.startsWith('enc:');
}

/**
 * Encrypt an OPAP AAT with an authorization PIN.
 * Output format: enc:<salt>:<iv>:<ciphertext>
 */
export async function encryptOpap(ast: OpapAAT, pin: string): Promise<string> {
  const subtle = getSubtle();
  const packed = packOpap(ast);
  const plainBytes = new TextEncoder().encode(packed);

  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);
  globalThis.crypto.getRandomValues(salt);
  globalThis.crypto.getRandomValues(iv);

  const key = await deriveKey(pin, salt);
  const ciphertextBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv: iv as any },
    key,
    plainBytes as any
  );

  const ciphertextBytes = new Uint8Array(ciphertextBuffer);
  const saltB64 = uint8ArrayToBase64Url(salt);
  const ivB64 = uint8ArrayToBase64Url(iv);
  const cipherB64 = uint8ArrayToBase64Url(ciphertextBytes);

  return `enc:${saltB64}:${ivB64}:${cipherB64}`;
}

/**
 * Decrypt an encrypted OPAP payload string using the authorization PIN.
 */
export async function decryptOpap(encryptedPayload: string, pin: string): Promise<OpapAAT> {
  const subtle = getSubtle();
  const clean = encryptedPayload.replace(/^#/, '').trim();
  if (!clean.startsWith('enc:')) {
    throw new Error('Payload is not an encrypted OPAP string');
  }

  const parts = clean.split(':');
  if (parts.length !== 4) {
    throw new Error('Malformed encrypted OPAP format');
  }

  const [, saltB64, ivB64, cipherB64] = parts;
  const salt = base64UrlToUint8Array(saltB64);
  const iv = base64UrlToUint8Array(ivB64);
  const ciphertext = base64UrlToUint8Array(cipherB64);

  try {
    const key = await deriveKey(pin, salt);
    const decryptedBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      ciphertext as any
    );

    const decryptedText = new TextDecoder().decode(decryptedBuffer);
    return unpackOpap(decryptedText);
  } catch {
    throw new Error('Incorrect authorization PIN or corrupted OPAP payload');
  }
}
