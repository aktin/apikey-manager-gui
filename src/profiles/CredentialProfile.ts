/**
 * Represents a saved credential profile for broker access.
 *
 * Persisted in encrypted form and retrieved through `ProfileStorage`.
 *
 * Each profile includes:
 * - `name`: Unique identifier for the profile (used as storage key)
 * - `key`: Admin API key for authenticating with the broker
 * - `url`: Base URL of the AKTIN broker instance
 * - `testDatabase`: Optional Postgres test database for the query builder
 * - `language`: UI language applied when the profile is loaded
 * - `timeZone`: IANA zone timestamps are displayed in, applied on load
 */
export interface CredentialProfile {
  name: string;
  key: string;
  url: string;
  testDatabase?: TestDatabaseConfig;
  language?: string;
  timeZone?: string;
}

/**
 * Connection settings of the Postgres test database the query builder runs
 * queries against, plus the dates substituted for the `${data.start}` and
 * `${data.end}` placeholders (ISO date strings).
 */
export interface TestDatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  start: string;
  end: string;
}
