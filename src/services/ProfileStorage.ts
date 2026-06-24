/**
 * ProfileStorage
 *
 * Static utility class for managing encrypted credential profiles using Electron's
 * `contextBridge` APIs (`storeAPI`, `profileCrypto`).
 *
 * Profiles are:
 * - Encrypted with AES-GCM before being stored
 * - Indexed by unique profile name
 * - Persisted in local storage using `electron-store`
 *
 * Also supports saving and restoring the last selected profile.
 */
import { CredentialProfile } from "../types/CredentialProfile";

export default class ProfileStorage {
  private static readonly PROFILE_KEY = "savedProfiles";
  private static readonly LAST_SELECTED_KEY = "LastSelected";

  private static async getProfileNames(): Promise<string[]> {
    return ((await window.storeAPI.get(this.PROFILE_KEY)) as string[]) || [];
  }

  private static serialize(profile: CredentialProfile): string {
    return `${profile.name};${profile.key};${profile.url}`;
  }

  private static deserialize(raw: string): CredentialProfile {
    const [name, key, url] = raw.split(";");
    return { name, key, url };
  }

  /**
   * Retrieves and decrypts all saved credential profiles.
   *
   * @returns Array of successfully decrypted `CredentialProfile` objects.
   */
  static async getAllProfiles(): Promise<CredentialProfile[]> {
    const names = await this.getProfileNames();
    const entries = await Promise.all(
      names.map(async (name) => {
        const raw = await window.storeAPI.get(name);
        if (!raw) return null;
        try {
          const decrypted = await window.profileCrypto.decrypt(raw as string);
          return this.deserialize(decrypted);
        } catch (err) {
          console.error(`Failed to decrypt profile "${name}":`, err);
          return null;
        }
      })
    );
    return entries.filter(Boolean) as CredentialProfile[];
  }

  /**
   * Loads and decrypts a single profile by name.
   *
   * @returns A decrypted `CredentialProfile` or `null` if not found
   */
  static async getProfile(name: string): Promise<CredentialProfile | null> {
    const raw = await window.storeAPI.get(name);
    if (!raw) return null;
    const decrypted = await window.profileCrypto.decrypt(raw as string);
    return this.deserialize(decrypted);
  }

  /**
   * Encrypts and saves a profile. Adds it to the list of saved profile names if new.
   */
  static async saveProfile(profile: CredentialProfile): Promise<void> {
    const existing = await this.getProfileNames();
    if (!existing.includes(profile.name)) {
      await window.storeAPI.set(this.PROFILE_KEY, [...existing, profile.name]);
    }
    const encrypted = await window.profileCrypto.encrypt(
      this.serialize(profile)
    );
    await window.storeAPI.set(profile.name, encrypted);
  }

  /**
   * Deletes a profile by name and removes it from the saved profile list.
   */
  static async deleteProfile(name: string): Promise<void> {
    const existing = await this.getProfileNames();
    const updated = existing.filter((k) => k !== name);
    await window.storeAPI.set(this.PROFILE_KEY, updated);
    await window.storeAPI.delete(name);
  }

  static async getLastSelected(): Promise<string | null> {
    return (await window.storeAPI.get(this.LAST_SELECTED_KEY)) as string | null;
  }

  static async setLastSelected(name: string): Promise<void> {
    await window.storeAPI.set(this.LAST_SELECTED_KEY, name);
  }
}
