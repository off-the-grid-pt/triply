import Link from "next/link";
import { signOutAction } from "@/features/auth/actions";

export function TripsPageHeader({ identity }: { identity: string }) {
  return <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
    <div className="min-w-0"><p className="text-xs text-muted-foreground">O seu espaço / Viagens</p><p className="mt-1 max-w-full break-all text-sm">{identity}</p></div>
    <div className="flex flex-wrap items-center gap-2"><Link href="/settings" className="rounded-control px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Definições</Link><form action={signOutAction}><button className="rounded-control px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Terminar sessão</button></form><Link href="/trips/new" className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"><span aria-hidden="true">+</span> Nova viagem</Link></div>
  </header>;
}
