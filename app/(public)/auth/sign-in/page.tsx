import { AuthForm, AuthLink } from "@/features/auth/auth-form";
import { signInAction } from "@/features/auth/actions";
import { AuthShell } from "@/components/shared/auth-shell";
import { safeInternalPath } from "@/features/auth/redirects";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string; link?: string }> }) {
  const params = await searchParams;
  const next = safeInternalPath(params.next);
  return (
    <AuthShell eyebrow="Bem-vindo de volta" title="Iniciar sessão" description="Entre para continuar a planear as suas viagens.">
      {params.reset === "success" ? <p className="mb-5 rounded-control border border-success bg-success-muted p-3 text-sm text-success">Palavra-passe atualizada. Já pode iniciar sessão.</p> : null}
      {params.link === "invalid" ? <p role="alert" className="mb-5 rounded-control border border-destructive bg-destructive-muted p-3 text-sm text-destructive">Esta ligação é inválida ou expirou. Inicie sessão ou peça uma nova recuperação de palavra-passe.</p> : null}
      <AuthForm action={signInAction} next={next} submitLabel="Iniciar sessão" fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "nome@exemplo.com" },
        { name: "password", label: "Palavra-passe", type: "password", autoComplete: "current-password" },
      ]} footer={<div className="flex flex-wrap justify-between gap-3"><AuthLink href="/auth/forgot-password">Esqueci-me da palavra-passe</AuthLink><span>Sem conta? <AuthLink href="/auth/sign-up">Criar conta</AuthLink></span></div>} />
    </AuthShell>
  );
}
