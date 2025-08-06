/**
 * Detects if chord data appears to be corrupted/encrypted
 * Common indicators: base64-like strings, binary data, unusual character patterns
 */
export function isCorruptedChordData(data: string): boolean {
  if (!data || data.trim() === "") {
    return false;
  }

  // Check for base64-like patterns (long strings with only base64 characters)
  const base64Pattern = /^[A-Za-z0-9+/]{20,}={0,2}$/;
  if (base64Pattern.test(data.replace(/\s/g, ""))) {
    return true;
  }

  // Check for excessive non-printable characters
  // eslint-disable-next-line no-control-regex
  const nonPrintableCount = (
    data.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\xFF]/g) || []
  ).length;
  if (nonPrintableCount > data.length * 0.1) {
    // More than 10% non-printable
    return true;
  }

  // Check for patterns that look like compressed data
  if (data.startsWith("�") || data.includes("\x00") || data.includes("\\x")) {
    return true;
  }

  return false;
}