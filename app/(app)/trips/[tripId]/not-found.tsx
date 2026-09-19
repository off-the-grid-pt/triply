import Link from "next/link";

export default function TripNotFound() {
  return <main className="flex min-h-screen items-center justify-center bg-background px-5"><div className="max-w-lg text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Viagem indisponível</p><h1 className="mt-3 text-3xl font-semibold">Não foi possível encontrar esta viagem.</h1><p className="mt-4 leading-7 text-muted-foreground">A viagem pode não existir ou não estar disponível para esta conta.</p><Link href="/trips" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Voltar às viagens</Link></div></main>;
}
