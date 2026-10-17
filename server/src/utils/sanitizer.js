/**
 * Project Hezal - CSV & Formula Injection Defense
 * Prevents Excel/Sheets formula injection by neutralizing dangerous leading characters (=, +, -, @, \t, \r)
 */

export function sanitizeField(val) {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (trimmed.length === 0) return '';
  
  // Check for dangerous leading formula trigger characters
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.includes(trimmed[0])) {
    // Escape with a leading single quote or strip if malicious
    return "'" + trimmed;
  }
  return trimmed;
}

export function sanitizeRecord(record) {
  if (!record || typeof record !== 'object') return record;
  const sanitized = {};
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeField(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function sanitizeExportString(str) {
  if (typeof str !== 'string') return str;
  const trimmed = str.trim();
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (trimmed.length > 0 && dangerousPrefixes.includes(trimmed[0])) {
    return "'" + trimmed;
  }
  return trimmed;
}
