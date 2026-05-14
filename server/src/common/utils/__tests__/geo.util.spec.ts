import { describe, it, expect } from "vitest";
import { isValidLngLat } from "../../../common/utils/coords.js";
import { escapeRegex } from "../../../common/utils/escape-regex.js";

/* ------------------------------------------------------------------ */
/*  isValidLngLat                                                      */
/* ------------------------------------------------------------------ */

describe("isValidLngLat", () => {
  it("should accept valid coordinate pair", () => {
    expect(isValidLngLat({ lng: 29.0, lat: 41.0 })).toBe(true);
  });

  it("should accept boundary values", () => {
    expect(isValidLngLat({ lng: -180, lat: -90 })).toBe(true);
    expect(isValidLngLat({ lng: 180, lat: 90 })).toBe(true);
    expect(isValidLngLat({ lng: 0, lat: 0 })).toBe(true);
  });

  it("should reject out-of-range longitude", () => {
    expect(isValidLngLat({ lng: 181, lat: 41 })).toBe(false);
    expect(isValidLngLat({ lng: -181, lat: 41 })).toBe(false);
  });

  it("should reject out-of-range latitude", () => {
    expect(isValidLngLat({ lng: 29, lat: 91 })).toBe(false);
    expect(isValidLngLat({ lng: 29, lat: -91 })).toBe(false);
  });

  it("should reject non-object values", () => {
    expect(isValidLngLat(null)).toBe(false);
    expect(isValidLngLat(undefined)).toBe(false);
    expect(isValidLngLat("29,41")).toBe(false);
    expect(isValidLngLat(42)).toBe(false);
    expect(isValidLngLat([])).toBe(false);
  });

  it("should reject object with missing fields", () => {
    expect(isValidLngLat({ lng: 29 })).toBe(false);
    expect(isValidLngLat({ lat: 41 })).toBe(false);
    expect(isValidLngLat({})).toBe(false);
  });

  it("should reject string values in fields", () => {
    expect(isValidLngLat({ lng: "29", lat: "41" })).toBe(false);
  });

  it("should reject NaN values", () => {
    expect(isValidLngLat({ lng: NaN, lat: 41 })).toBe(false);
    expect(isValidLngLat({ lng: 29, lat: NaN })).toBe(false);
  });

  it("should reject $ne injection object", () => {
    expect(isValidLngLat({ lng: { $ne: "" }, lat: 41 })).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  escapeRegex                                                        */
/* ------------------------------------------------------------------ */

describe("escapeRegex", () => {
  it("should escape regex special characters", () => {
    expect(escapeRegex("hello.world")).toBe("hello\\.world");
    expect(escapeRegex("a+b*c?")).toBe("a\\+b\\*c\\?");
  });

  it("should escape all metacharacters", () => {
    const input = ".*+?^${}()|[]\\";
    const escaped = escapeRegex(input);

    for (const char of [".", "*", "+", "?", "^", "$", "{", "}", "(", ")", "|", "[", "]", "\\"]) {
      expect(escaped).toContain(`\\${char}`);
    }
  });

  it("should escape SQL LIKE wildcards (% and _)", () => {
    expect(escapeRegex("100%")).toBe("100\\%");
    expect(escapeRegex("first_name")).toBe("first\\_name");
  });

  it("should return plain strings unchanged", () => {
    expect(escapeRegex("hello")).toBe("hello");
    expect(escapeRegex("simple text 123")).toBe("simple text 123");
  });

  it("should handle empty string", () => {
    expect(escapeRegex("")).toBe("");
  });

  it("should handle super-long strings", () => {
    const longInput = "a".repeat(10_000) + ".*" + "b".repeat(10_000);
    const result = escapeRegex(longInput);

    expect(result).toContain("\\.\\*");
    expect(result.length).toBeGreaterThan(longInput.length);
  });
});
