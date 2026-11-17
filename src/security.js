import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function normalizeName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
}

export function normalizeCode(value) {
  return String(value ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function newVisitorCode() {
  // 10 characters from an ambiguity-reduced alphabet; generated server-side.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(10);
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

export function tokenHash(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export function safeEqualHex(a, b) {
  if (!/^[a-f0-9]{64}$/i.test(a ?? "") || !/^[a-f0-9]{64}$/i.test(b ?? "")) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

export function validConsent(value) {
  return value === true || value === "true" || value === "on";
}
