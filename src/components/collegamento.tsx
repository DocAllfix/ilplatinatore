// Un link normale, con caricamento completo della pagina (Fase 5, scelta dell'utente): lo script
// della pubblicita' di HB Agency trova gli spazi solo quando la pagina si carica da zero, come sul
// sito di oggi. Stessa interfaccia di next/link (href, prefetch ignorato), cosi' basta cambiare
// l'import. Le pagine sono gia' pronte in memoria su Vercel: il caricamento resta veloce.

import type { AnchorHTMLAttributes } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean };

export default function Collegamento({ prefetch, href, ...resto }: Props) {
  void prefetch;
  return <a href={href} {...resto} />;
}
