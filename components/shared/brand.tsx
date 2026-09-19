import Link from "next/link";

export function Brand({ href = "/" }: { href?: string }) {
  return <Link href={href} className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight" aria-label="Triply — início"><span aria-hidden="true" className="flex size-8 items-center justify-center rounded-control border border-foreground/70 font-serif text-xl font-bold">t</span><span className="lowercase">Triply</span><span aria-hidden="true" className="text-muted-foreground">.</span></Link>;
}
