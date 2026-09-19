"use client";

export default function TripsError({ reset }: { error: Error; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-background px-5"><div className="max-w-md rounded-card border border-destructive bg-card p-8 text-center"><h1 className="text-2xl font-semibold">Não foi possível carregar as viagens</h1><p className="mt-3 text-muted-foreground">Verifique a ligação e tente novamente.</p><button onClick={reset} className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Tentar novamente</button></div></main>;
}
