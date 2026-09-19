"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Brand } from "./brand";

export function AppShell({ children, account }: { children: ReactNode; account?: ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const tripId = segments[0] === "trips" && segments[1] && segments[1] !== "new" ? segments[1] : null;
  const tripLinks = tripId ? [
    { href: `/trips/${tripId}`, label: "Visão geral" },
    { href: `/trips/${tripId}#route`, label: "Rota e destinos" },
    { href: `/trips/${tripId}/finance`, label: "Orçamento" },
    { href: `/trips/${tripId}/savings`, label: "Poupança" },
    { href: `/trips/${tripId}/itinerary`, label: "Itinerário" },
    { href: `/trips/${tripId}/planning`, label: "Planeamento" },
    { href: `/trips/${tripId}/documents`, label: "Documentos" },
    { href: `/trips/${tripId}/settings`, label: "Definições da viagem" },
  ] : [];
  const isActive = (href: string) => pathname === href || (tripId !== null && href.startsWith(`/trips/${tripId}/`) && pathname.startsWith(`${href}/`));
  const renderLink = ({ href, label }: { href: string; label: string }, index: number) => (
    <Link key={href} href={href} onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} aria-current={isActive(href) ? "page" : undefined} className={`relative flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors ${isActive(href) ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
      {isActive(href) && <span aria-hidden="true" className="absolute left-0 h-4 w-0.5 rounded-full bg-link" />}
      <span aria-hidden="true" className="w-4 text-center text-xs">{href === "/trips" ? "▦" : href === "/trips/new" ? "+" : index === 0 ? "▤" : "·"}</span>
      {label}
    </Link>
  );
  const navigation = <>
    <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">O seu espaço</p>
    {[{ href: "/trips", label: "Todas as viagens" }, { href: "/trips/new", label: "Nova viagem" }].map(renderLink)}
    {tripLinks.length > 0 && <div className="mt-5 border-t border-border pt-5">
      <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">Nesta viagem</p>
      {tripLinks.map(renderLink)}
    </div>}
    <div className="mt-5 border-t border-border pt-3"><Link href="/settings" aria-current={pathname === "/settings" ? "page" : undefined} className="flex min-h-11 items-center rounded-control px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">Definições da conta</Link></div>
  </>;
  return <div className="min-h-screen bg-background text-foreground">
    <a href="#workspace-content" className="sr-only z-50 rounded-control bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Saltar para o conteúdo</a>
    <aside className="fixed inset-y-0 left-0 hidden w-[232px] flex-col border-r border-border bg-surface lg:flex">
      <div className="px-6 py-7"><Brand href="/trips" /></div>
      <nav aria-label="Navegação principal" className="flex-1 overflow-y-auto px-3 py-4">{navigation}</nav>
      <div className="border-t border-border p-5 text-xs text-muted-foreground">{account ?? "Um espaço para cada viagem."}</div>
    </aside>
    <header className="border-b border-border bg-surface px-5 py-4 lg:hidden"><div className="flex items-center justify-between"><Brand href="/trips" /><span className="text-xs text-muted-foreground">O seu espaço de viagem</span></div><details key={pathname} className="mt-4"><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">Menu de navegação</summary><nav aria-label="Navegação principal" className="pb-2 pt-4">{navigation}</nav>{account && <div className="border-t border-border py-3 text-xs text-muted-foreground">{account}</div>}</details></header>
    <div id="workspace-content" tabIndex={-1} className="min-w-0 lg:ml-[232px]">{children}</div>
  </div>;
}
