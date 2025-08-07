export interface CredentialProfile {
  name: string;
  key: string;
  url: string;
}

export default class ProfileStorage {
  private static readonly PROFILE_KEY = "savedProfiles";
  private static readonly LAST_SELECTED_KEY = "LastSelected";

  static async getAllProfiles(): Promise<CredentialProfile[]> {
    const names = (await window.storeAPI.get(this.PROFILE_KEY)) as string[] || [];
    const entries = await Promise.all(names.map(async (name) => {
      const raw = await window.storeAPI.get(name);
      if (!raw) return null;
      const [n, k, u] = (raw as string).split(";");
      return {name: n, key: k, url: u} satisfies CredentialProfile;
    }));
    return entries.filter(Boolean) as CredentialProfile[];
  }

  static async getProfile(name: string): Promise<CredentialProfile | null> {
    const raw = await window.storeAPI.get(name);
    if (!raw) return null;
    const [n, k, u] = (raw as string).split(";");
    return {name: n, key: k, url: u};
  }

  static async saveProfile(profile: CredentialProfile): Promise<void> {
    const existing = (await window.storeAPI.get(this.PROFILE_KEY)) as string[] || [];
    if (!existing.includes(profile.name)) {
      await window.storeAPI.set(this.PROFILE_KEY, [...existing, profile.name]);
    }
    await window.storeAPI.set(profile.name, `${profile.name};${profile.key};${profile.url}`);
  }

  static async deleteProfile(name: string): Promise<void> {
    const existing = (await window.storeAPI.get(this.PROFILE_KEY)) as string[] || [];
    const updated = existing.filter(k => k !== name);
    await window.storeAPI.set(this.PROFILE_KEY, updated);
    await window.storeAPI.delete(name);
  }

  static async getLastSelected(): Promise<string | null> {
    return await window.storeAPI.get(this.LAST_SELECTED_KEY) as string | null;
  }

  static async setLastSelected(name: string): Promise<void> {
    await window.storeAPI.set(this.LAST_SELECTED_KEY, name);
  }
}
