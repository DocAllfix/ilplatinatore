// La sfida del giorno (PDF 08, piano 05) su /sfida/: indirizzo nuovo, nessun conflitto con quelli
// di oggi. Si rigenera spesso perche' a mezzanotte cambia la sfida.

import type { Metadata } from "next";
import { SelettoreVarianti } from "@/components/lab/selettore-varianti";
import { FormatiDiProva } from "@/components/sfida/formati-di-prova";
import { LaSfida } from "@/components/sfida/sfida";
import { sitoPubblico } from "@/lib/cms/config";
import { robots } from "@/lib/cms/metadati";
import { giornoRoma, type Formato } from "@/lib/sfida";
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
  const presenti = (Object.keys(dati.sfide) as Formato[]).filter((f) => dati.sfide[f]);
  return (
    // Prova del piano 05 (docs/brief/05-mini-gioco.md): tre varianti, ?v=a|b|c; formati con ?f=
    <div id="lab" data-v="a">
      <style>{`#lab[data-v="a"] [data-variant]:not([data-variant="a"]),#lab[data-v="b"] [data-variant]:not([data-variant="b"]),#lab[data-v="c"] [data-variant]:not([data-variant="c"]){display:none}`}</style>
      <h1 className="sr-only">La sfida del giorno</h1>
      <FormatiDiProva presenti={presenti} />
      {(["a", "b", "c"] as const).map((v) => (
        <div key={v} data-variant={v}>
          <LaSfida dati={dati} variante={v} />
        </div>
      ))}
      <SelettoreVarianti
        sezione="Sfida"
        posizione="alto"
        varianti={[
          { id: "a", nome: "Scheda" },
          { id: "b", nome: "Ricerca" },
          { id: "c", nome: "Rivelazione" },
        ]}
      />
    </div>
  );
}
