"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, resetPasswordSchema, signInSchema, signUpSchema, emailSchema } from "./validation";
import type { AuthActionState } from "./types";
import { safeInternalPath } from "./redirects";

function fieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  const flattened = error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.entries(flattened).map(([key, messages]) => [key, messages?.[0]]),
  );
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function signUpAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const rateLimited = error.status === 429;
    return {
      status: "error",
      message: rateLimited
        ? "Foram feitas demasiadas tentativas. Aguarde um pouco e tente novamente."
        : "Não foi possível concluir o registo. Verifique os dados ou tente iniciar sessão.",
    };
  }

  if (!data.session || !data.user) {
    return { status: "error", message: "Não foi possível iniciar a sessão após o registo. Tente iniciar sessão ou contacte o suporte." };
  }

  redirect("/onboarding");
}

export async function signInAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  }

  const next = safeInternalPath(String(formData.get("next") ?? ""));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user || !data.session) {
    return {
      status: "error",
      message: "Não foi possível iniciar sessão. Verifique os seus dados e tente novamente.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) redirect("/onboarding");
  redirect(next);
}

export async function forgotPasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", fieldErrors: { email: "Introduza um email válido." } };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl()}/auth/callback?next=/auth/update-password`,
  });

  return {
    status: "success",
    message: "Se existir uma conta associada a este email, receberá uma ligação para redefinir a palavra-passe.",
  };
}

export async function updatePasswordAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { status: "error", message: "Esta ligação expirou ou já não é válida. Peça uma nova recuperação." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { status: "error", message: "Não foi possível redefinir a palavra-passe. Peça uma nova ligação e tente novamente." };
  }

  await supabase.auth.signOut();
  redirect("/auth/sign-in?reset=success");
}

export async function completeOnboardingAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = onboardingSchema.safeParse({
    displayName: formData.get("displayName"),
    currency: formData.get("currency"),
    locale: formData.get("locale"),
  });

  if (!parsed.success) {
    return { status: "error", fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    redirect("/auth/sign-in");
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      display_name: parsed.data.displayName,
      default_currency: parsed.data.currency,
      locale: parsed.data.locale,
      onboarding_completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    return { status: "error", message: "Não foi possível guardar as suas preferências. Tente novamente." };
  }

  redirect("/trips");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/sign-in");
}
