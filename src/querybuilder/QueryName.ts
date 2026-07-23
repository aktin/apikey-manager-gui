/**
 * Shared validation for saved-query file names, used by the main process
 * (authoritative, throws on violation) and the renderer (early UX feedback
 * only). A valid name is a plain file name: whitelisted characters, no path
 * separators, no "..", no leading dot, and no Windows-reserved device name.
 */
export const QUERY_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ._-]*$/;

const WINDOWS_RESERVED_NAMES = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

export function isValidQueryName(name: string): boolean {
  if (!QUERY_NAME_PATTERN.test(name) || name.includes("..")) return false;
  // Windows treats "con.xml" like the device "con", so check the base name
  // (everything before the first dot).
  const baseName = name.split(".")[0].trim();
  return !WINDOWS_RESERVED_NAMES.test(baseName);
}
