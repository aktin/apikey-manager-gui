/**
 * Provides AES-GCM encryption and decryption for secure profile storage.
 *
 * Key management:
 * - A 256-bit AES key is generated once and stored securely using `keytar`
 * - The key is encoded as base64 and saved under the system keychain:
 *   - macOS → Keychain
 *   - Windows → Credential Vault
 *   - Linux → libsecret (GNOME Keyring or KWallet)
 * - The key is retrieved and kept in memory only during runtime
 *
 * Encryption details:
 * - AES-GCM is used with a random 12-byte IV
 * - The IV is prepended to the ciphertext and base64-encoded for storage
 *
 * This module runs in the Electron main process and is accessed via IPC from the renderer.
 *
 * @see preload.ts (via `profileCrypto.encrypt` / `decrypt`)
 */
import path from "node:path";
import {app} from "electron";
import {randomBytes} from "crypto";
import {TextDecoder, TextEncoder} from "util";

let keytar: typeof import("keytar");

if (app.isPackaged) {
  // Manually load from resources folder in production
  keytar = require(
      path.join(app.getAppPath(), "..", "keytar", "build", "Release", "keytar.node")
  );
} else {
  // Use regular require in dev mode
  keytar = require("keytar");
}

const SERVICE = "BrokerCredentialStorage";
const ACCOUNT = "encryption-key";
const IV_LENGTH = 12;

let encryptionKey: Uint8Array;

/**
 * Loads the existing encryption key from keytar, or creates and stores a new one.
 *
 * @returns A CryptoKey usable for AES-GCM operations
 */
async function getOrCreateKey(): Promise<CryptoKey> {
  if (encryptionKey) return await importKey(encryptionKey);

  const stored = await keytar.getPassword(SERVICE, ACCOUNT);
  if (stored) {
    encryptionKey = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
  } else {
    encryptionKey = randomBytes(32);
    await keytar.setPassword(SERVICE, ACCOUNT, btoa(String.fromCharCode(...encryptionKey)));
  }

  return importKey(encryptionKey);
}

/**
 * Imports a raw 256-bit AES key into a usable `CryptoKey` instance.
 *
 * @param raw - Raw binary key data (32 bytes)
 * @returns A CryptoKey for use in AES-GCM
 */
async function importKey(raw: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/**
 * Encrypts a UTF-8 string using AES-GCM.
 *
 * @param text - The plaintext to encrypt
 * @returns A base64-encoded string (IV + ciphertext)
 */
export async function encrypt(text: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(text);
  const key = await getOrCreateKey();
  const encrypted = await crypto.subtle.encrypt({name: "AES-GCM", iv}, key, encoded);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a previously encrypted base64-encoded string.
 *
 * @param base64 - A base64 string containing IV + ciphertext
 * @returns The decrypted UTF-8 string
 */
export async function decrypt(base64: string): Promise<string> {
  const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const iv = binary.slice(0, IV_LENGTH);
  const data = binary.slice(IV_LENGTH);
  const key = await getOrCreateKey();
  const decrypted = await crypto.subtle.decrypt({name: "AES-GCM", iv}, key, data);
  return new TextDecoder().decode(decrypted);
}
