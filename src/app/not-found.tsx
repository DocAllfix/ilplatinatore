import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pagina non trovata - 🎮 Il Platinatore" };

export default function NonTrovata() {
  return (
    <div className="py-10">
      <h1 className="text-2xl font-bold">Pagina non trovata</h1>
      <p className="mt-3 text-tenue">L&apos;indirizzo non esiste o l&apos;articolo è stato spostato.</p>
      <p className="mt-6">
        <Link href="/" className="text-accento underline">
          Torna alla home
        </Link>
      </p>
    </div>
  );
}
