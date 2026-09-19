import { AuthForm, AuthLink } from "@/features/auth/auth-form";
import { forgotPasswordAction } from "@/features/auth/actions";
import { AuthShell } from "@/components/shared/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell eyebrow="Recuperação" title="Redefinir palavra-passe" description="Indique o email da sua conta. Se existir uma conta associada, enviaremos as instruções.">
      <AuthForm action={forgotPasswordAction} submitLabel="Enviar ligação" fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]} footer={<AuthLink href="/auth/sign-in">Voltar a iniciar sessão</AuthLink>} />
    </AuthShell>
  );
}
