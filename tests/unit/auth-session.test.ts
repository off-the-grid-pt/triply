import { isValidElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeOnboardingAction, signInAction, signUpAction } from "@/features/auth/actions";
import PrivateAppLayout from "@/app/(app)/layout";
import OnboardingPage from "@/app/onboarding/page";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn(), getUser: vi.fn(),
  from: vi.fn(), select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(), upsert: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({
  auth: { signInWithPassword: mocks.signIn, signUp: mocks.signUp, signOut: mocks.signOut, getUser: mocks.getUser },
  from: mocks.from,
}) }));

const user = { id: "authenticated-owner", email_confirmed_at: null };
const session = { user };
function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}
const credentials = () => form({ email: "test@example.com", password: "test-password", next: "/trips" });
const preferences = () => form({ displayName: "Pessoa", currency: "EUR", locale: "pt-PT", user_id: "forged-owner" });

beforeEach(() => {
  vi.resetAllMocks();
  const query = { select: mocks.select, eq: mocks.eq, maybeSingle: mocks.maybeSingle, upsert: mocks.upsert };
  mocks.from.mockReturnValue(query);
  mocks.select.mockReturnValue(query);
  mocks.eq.mockReturnValue(query);
  mocks.maybeSingle.mockResolvedValue({ data: { onboarding_completed_at: "2026-09-01T00:00:00Z" } });
  mocks.upsert.mockResolvedValue({ error: null });
  mocks.getUser.mockResolvedValue({ data: { user }, error: null });
  mocks.signIn.mockResolvedValue({ data: { user, session }, error: null });
  mocks.signUp.mockResolvedValue({ data: { user, session }, error: null });
});

describe("password sessions without an email confirmation gate", () => {
  it("accepts an authenticated unconfirmed user without signing them out", async () => {
    await expect(signInAction({ status: "idle" }, credentials())).rejects.toThrow("REDIRECT:/trips");
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.eq).toHaveBeenCalledWith("user_id", user.id);
  });
  it("still requires onboarding for a new authenticated user", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null });
    await expect(signInAction({ status: "idle" }, credentials())).rejects.toThrow("REDIRECT:/onboarding");
  });
  it.each(["Invalid login credentials", "Email not confirmed"])("does not bypass provider rejection: %s", async (message) => {
    mocks.signIn.mockResolvedValue({ data: { user: null, session: null }, error: { message } });
    const result = await signInAction({ status: "idle" }, credentials());
    expect(result.status).toBe("error");
    expect(result.message).not.toContain("Confirme");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("does not treat a user object without a session as successful login", async () => {
    mocks.signIn.mockResolvedValue({ data: { user, session: null }, error: null });
    expect((await signInAction({ status: "idle" }, credentials())).status).toBe("error");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("takes an authenticated signup directly to onboarding", async () => {
    await expect(signUpAction({ status: "idle" }, credentials())).rejects.toThrow("REDIRECT:/onboarding");
    expect(mocks.signUp).toHaveBeenCalledWith({ email: "test@example.com", password: "test-password" });
  });
  it("shows a recoverable error if provider confirmation settings prevent signup session creation", async () => {
    mocks.signUp.mockResolvedValue({ data: { user, session: null }, error: null });
    expect((await signUpAction({ status: "idle" }, credentials())).status).toBe("error");
  });
  it("preserves authenticated private layout access without an email timestamp", async () => {
    expect(isValidElement(await PrivateAppLayout({ children: "Private content" }))).toBe(true);
  });
  it("rejects unauthenticated private layout access", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(PrivateAppLayout({ children: "Private content" })).rejects.toThrow("REDIRECT:/auth/sign-in");
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("renders onboarding for an authenticated unconfirmed user", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null });
    expect(isValidElement(await OnboardingPage())).toBe(true);
  });
  it("saves preferences only for the authenticated owner", async () => {
    await expect(completeOnboardingAction({ status: "idle" }, preferences())).rejects.toThrow("REDIRECT:/trips");
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: user.id }), { onConflict: "user_id" });
  });
  it("rejects unauthenticated onboarding writes", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(completeOnboardingAction({ status: "idle" }, preferences())).rejects.toThrow("REDIRECT:/auth/sign-in");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
