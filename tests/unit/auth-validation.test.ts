import { describe, expect, it } from "vitest";
import { onboardingSchema, resetPasswordSchema, signUpSchema } from "@/features/auth/validation";
import { safeInternalPath } from "@/features/auth/redirects";

describe("auth validation", () => {
  it("requires at least 8 password characters", () => {
    expect(signUpSchema.safeParse({ email: "a@b.com", password: "1234567" }).success).toBe(false);
    expect(signUpSchema.safeParse({ email: "a@b.com", password: "12345678" }).success).toBe(true);
  });

  it("requires matching reset passwords", () => {
    expect(resetPasswordSchema.safeParse({ password: "12345678", confirmPassword: "87654321" }).success).toBe(false);
  });

  it("enforces 80-char display names", () => {
    expect(onboardingSchema.safeParse({ displayName: "a".repeat(81), currency: "EUR", locale: "pt-PT" }).success).toBe(false);
  });
});

describe("safeInternalPath", () => {
  it("allows internal paths", () => expect(safeInternalPath("/trips?view=all")).toBe("/trips?view=all"));
  it("blocks protocol-relative redirects", () => expect(safeInternalPath("//evil.example")).toBe("/trips"));
  it("blocks absolute external redirects", () => expect(safeInternalPath("https://evil.example")).toBe("/trips"));
});
