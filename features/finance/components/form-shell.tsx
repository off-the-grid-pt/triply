import Link from "next/link";

export function Shell({tripId,title,children}:{tripId:string;title:string;children:React.ReactNode}){return <main className="min-h-screen bg-background px-5 py-8"><div className="mx-auto max-w-2xl"><Link href={`/trips/${tripId}/finance`} className="text-sm text-muted-foreground">← Finanças</Link><h1 className="my-8 text-3xl font-semibold">{title}</h1><section className="rounded-feature border border-border bg-card p-6 sm:p-8">{children}</section></div></main>}
