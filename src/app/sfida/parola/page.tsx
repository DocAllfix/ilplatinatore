// «La parola» (gioco 4): Wordle sui videogiochi su /sfida/parola/, indirizzo nuovo. Si rigenera
// spesso perche' a mezzanotte cambiano le parole.

import type { Metadata } from "next";
import { LaParola } from "@/components/parola/parola";
import { sitoPubblico } from "@/lib/cms/config";
import { robotsConDopo } from "@/lib/cms/metadati";
import { datiParola } from "@/lib/parola-dati";
import { giornoRoma } from "@/lib/sfida";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "La parola: indovina il gioco, la software house o il boss - 🎮 Il Platinatore" },
  description: "Il Wordle dei videogiochi: ogni giorno tre parole, dal nome del gioco al boss. Sei tentativi, le lettere colorate ti dicono quanto sei vicino.",
  alternates: { canonical: `${sitoPubblico().replace(/\/$/, "")}/sfida/parola/` },
  ...robotsConDopo(true),
};

export default async function PaginaParola() {
  return <LaParola dati={await datiParola(giornoRoma(new Date()))} />;
}
