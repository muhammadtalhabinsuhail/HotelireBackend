export function normalizeCanadianPhone(phone) {
  if (!phone) {
    throw new Error("Phone number is required");
  }

  // Remove spaces, dashes, brackets etc
  let cleaned = phone.replace(/[^0-9+]/g, "");

  // Case 1: Must explicitly start with +1
  if (cleaned.startsWith("+1")) {
    const digits = cleaned.slice(2);

    if (!/^\d{10}$/.test(digits)) {
      throw new Error("Invalid Canadian phone number. After +1 must be 10 digits");
    }

    return `+1${digits}`;
  }

  // Case 2: Exactly 10 digits (local Canadian number)
  if (/^\d{10}$/.test(cleaned)) {
    return `+1${cleaned}`;
  }

  // ❌ Reject ambiguous 11-digit numbers starting with 1
  if (/^1\d{10}$/.test(cleaned)) {
    throw new Error(
      "Invalid phone number. Use +1XXXXXXXXXX or 10-digit Canadian number"
    );
  }

  // Everything else invalid
  throw new Error("Invalid Canadian phone number format");
}
