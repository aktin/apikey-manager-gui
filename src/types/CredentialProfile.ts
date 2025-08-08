/**
 * Represents a saved credential profile for broker access.
 *
 * Each profile includes:
 * - `name`: Unique identifier for the profile (used as storage key)
 * - `key`: Admin API key for authenticating with the broker
 * - `url`: Base URL of the AKTIN broker instance
 */
export interface CredentialProfile {
  name: string;
  key: string;
  url: string;
}