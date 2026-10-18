// Il bottone «discreto ma ben visibile» chiesto dal proprietario (piano 07): stesso blocco Acido
// inclinato delle ore per il Platino (BloccoAcido in guida/scheda.tsx), con la scritta scura. Il
// bianco sull'Acido non si legge (1,1:1): la scritta resta Notte (16:1).

import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/ssr";
import Link from "@/components/collegamento";

export function BottoneAcido({ href, children, verso = "avanti" }: { href: string; children: React.ReactNode; verso?: "avanti" | "indietro" }) {
  return (
    <Link
      prefetch={false}
      href={href}
      className="inline-flex min-h-11 -skew-x-6 items-center gap-1.5 bg-azione px-3.5 text-sm font-bold text-su-azione transition-transform duration-150 active:scale-[0.97] [@media(hover:hover)]:hover:-translate-y-px"
    >
      {verso === "indietro" && <ArrowLeftIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
      {verso === "avanti" && <ArrowRightIcon weight="bold" className="size-4 shrink-0" aria-hidden="true" />}
    </Link>
  );
}
