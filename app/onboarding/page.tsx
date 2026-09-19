import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/features/auth/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) redirect("/auth/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, default_currency, locale, onboarding_completed_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed_at) redirect("/trips");

  return (
    <main className="min-h-screen bg-background px-5 py-12 text-foreground">
      <div className="mx-auto max-w-xl rounded-feature border border-border bg-card p-7 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">TRIPLY · CONFIGURAÇÃO INICIAL</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Prepare o seu espaço</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">São apenas três preferências. Pode alterá-las mais tarde sem modificar as viagens já criadas.</p>
        <OnboardingForm initialName={profile?.display_name ?? ""} initialCurrency={profile?.default_currency ?? "EUR"} initialLocale={profile?.locale ?? "pt-PT"} />
      </div>
    </main>
  );
}
