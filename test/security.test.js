import test from "node:test";
import assert from "node:assert/strict";
import { normalizeName, normalizeCode, newVisitorCode, tokenHash, safeEqualHex, validConsent } from "../src/security.js";

test("normalizes names without allowing unbounded input", () => {
  assert.equal(normalizeName("  Ada   Lovelace "), "Ada Lovelace");
  assert.equal(normalizeName("x".repeat(100)).length, 80);
});
test("visitor codes are normalized and have 10 characters", () => {
  const code = newVisitorCode();
  assert.equal(code.length, 10);
  assert.equal(normalizeCode(` ${code.toLowerCase()} `), code);
});
test("hash comparison accepts only matching SHA-256 hex values", () => {
  const hash = tokenHash("ABC123");
  assert.equal(safeEqualHex(hash, tokenHash("ABC123")), true);
  assert.equal(safeEqualHex(hash, tokenHash("wrong")), false);
  assert.equal(safeEqualHex("not-a-hash", hash), false);
});
test("consent is explicit rather than truthy", () => {
  assert.equal(validConsent(true), true);
  assert.equal(validConsent("true"), true);
  assert.equal(validConsent("false"), false);
  assert.equal(validConsent("yes"), false);
});