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

async function importKey(raw: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

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

export async function decrypt(base64: string): Promise<string> {
  const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const iv = binary.slice(0, IV_LENGTH);
  const data = binary.slice(IV_LENGTH);
  const key = await getOrCreateKey();
  const decrypted = await crypto.subtle.decrypt({name: "AES-GCM", iv}, key, data);
  return new TextDecoder().decode(decrypted);
}
