// La sfida del giorno (PDF 08, piano 05) su /sfida/: indirizzo nuovo, nessun conflitto con quelli
// di oggi. Si rigenera spesso perche' a mezzanotte cambia la sfida.

import type { Metadata } from "next";
import { LaSfida } from "@/components/sfida/sfida";
import { sitoPubblico } from "@/lib/cms/config";
import { robots } from "@/lib/cms/metadati";
import { giornoRoma } from "@/lib/sfida";
import { datiSfida } from "@/lib/sfida-dati";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "La sfida del giorno: riconosci il gioco - 🎮 Il Platinatore" },
  description: "Ogni giorno una sfida nuova: riconosci il gioco dall'immagine, indovina il trofeo o il classico dagli indizi. Cinque tentativi, soluzione sempre in chiaro.",
  alternates: { canonical: `${sitoPubblico().replace(/\/$/, "")}/sfida/` },
  robots: robots(true),
};

export default async function PaginaSfida() {
  const dati = await datiSfida(giornoRoma(new Date()));
  return (
    // Piano 05 chiuso: regole per formato in lib/sfida.ts (REGOLE)
    <>
      <h1 className="sr-only">La sfida del giorno</h1>
      <LaSfida dati={dati} />
    </>
  );
}
