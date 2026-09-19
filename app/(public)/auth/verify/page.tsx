import { redirect } from "next/navigation";

// Keep old email links recoverable without retaining a verification gate.
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  redirect(error ? "/auth/sign-in?link=invalid" : "/auth/sign-in");
}
