import Link from "next/link";
import { AccountSettingsForm } from "@/features/settings/components/forms";
import { getAccountSettings } from "@/features/settings/queries";
export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {  
const [settings, query] = await Promise.all([getAccountSettings(), searchParams]); return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><Link href="/trips">← Voltar às viagens</Link>
      <header className="my-8"><p className="text-xs font-semibold uppercase tracking-[.18em] text-muted-foreground">Conta</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Definições</h1><p className="mt-3 text-muted-foreground">Escolha os valores predefinidos para novas viagens sem alterar o histórico existente.</p></header>
      {query.saved ? <p role="status" className="mb-5 rounded-control border border-success bg-success-muted p-3 text-sm text-success">Definições guardadas.</p> : null}<div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section aria-labelledby="profile-title" className="rounded-feature border border-border bg-card p-6 sm:p-8"><h2 id="profile-title" className="mb-6 text-2xl font-semibold">Perfil e preferências</h2><AccountSettingsForm settings={settings} /></section>

        <section aria-labelledby="security-title" className="rounded-feature border border-border bg-surface p-6"><h2 id="security-title" className="text-xl font-semibold">Segurança</h2><p className="mt-2 text-sm text-muted-foreground">A alteração de email e eliminação da conta não fazem parte destas definições.</p><Link href="/auth/forgot-password" className="mt-4 inline-block font-semibold underline">Recuperar ou alterar palavra-passe</Link></section>
      </div></div></main>
  );
}
