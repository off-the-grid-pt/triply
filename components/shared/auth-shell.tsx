import type { ReactNode } from "react";
import { Brand } from "./brand";

export function AuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[0.9fr_1.1fr]">
    <section className="flex flex-col justify-between border-b border-border bg-surface p-6 sm:p-10 lg:min-h-screen lg:border-r lg:border-b-0 lg:p-14">
      <Brand />
      <div className="hidden max-w-md py-16 lg:block"><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Menos separadores. Mais viagem.</p><h2 className="mt-6 text-5xl font-semibold leading-[1.12] tracking-tight">Cada destino.<br />Tudo no seu lugar.</h2><p className="mt-6 text-base leading-7 text-muted-foreground">Da primeira ideia ao último destino, reúna a rota, as contas e os planos num único espaço.</p><div aria-hidden="true" className="mt-12 space-y-0">{["Imaginar a viagem", "Organizar cada etapa", "Partir com tudo preparado"].map((label, index) => <div key={label} className="flex items-center gap-4 border-b border-border py-5"><span className="flex size-7 items-center justify-center rounded-control border border-border text-xs text-muted-foreground">0{index + 1}</span><span className="text-sm">{label}</span></div>)}</div></div>
      <p className="hidden text-xs text-muted-foreground lg:block">O seu próximo capítulo começa aqui.</p>
    </section>
    <section className="flex items-center justify-center px-6 py-14 sm:px-12 lg:px-16"><div className="w-full max-w-md"><p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{eyebrow}</p><h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1><p className="mt-4 text-sm leading-6 text-muted-foreground">{description}</p><div className="mt-8">{children}</div></div></section>
  </main>;
}
