import { AuthForm, AuthLink } from "@/features/auth/auth-form";
import { updatePasswordAction } from "@/features/auth/actions";
import { AuthShell } from "@/components/shared/auth-shell";

export default function UpdatePasswordPage() {
  return (
    <AuthShell eyebrow="Segurança" title="Nova palavra-passe" description="Escolha uma nova palavra-passe com pelo menos 8 caracteres.">
      <AuthForm action={updatePasswordAction} submitLabel="Guardar nova palavra-passe" fields={[
        { name: "password", label: "Nova palavra-passe", type: "password", autoComplete: "new-password" },
        { name: "confirmPassword", label: "Confirmar palavra-passe", type: "password", autoComplete: "new-password" },
      ]} footer={<AuthLink href="/auth/forgot-password">Pedir nova ligação</AuthLink>} />
    </AuthShell>
  );
}
