import { AuthForm, AuthLink } from "@/features/auth/auth-form";
import { signUpAction } from "@/features/auth/actions";
import { AuthShell } from "@/components/shared/auth-shell";

export default function SignUpPage() {
  return (
    <AuthShell eyebrow="Começar" title="Criar conta" description="Crie a sua conta Triply. Vai precisar de confirmar o email antes de entrar.">
      <AuthForm action={signUpAction} submitLabel="Criar conta" fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "nome@exemplo.com" },
        { name: "password", label: "Palavra-passe", type: "password", autoComplete: "new-password" },
      ]} footer={<span>Já tem conta? <AuthLink href="/auth/sign-in">Iniciar sessão</AuthLink></span>} />
    </AuthShell>
  );
}
