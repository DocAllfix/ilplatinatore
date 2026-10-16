import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { robots } from "@/lib/cms/metadati";

// Nessuna pagina pubblica legge la richiesta (headers, cookies): renderebbe dinamico tutto il sito,
// e il primo articolo pubblicato dopo il build risponderebbe 500 (trappola del riferimento).

export const metadata: Metadata = {
  robots: robots(),
};

const VOCI = [
  { href: "/category/guide/", testo: "Guide" },
  { href: "/category/news/", testo: "News" },
  { href: "/category/approfondimenti/", testo: "Approfondimenti" },
  { href: "/category/videogiochi/", testo: "Videogiochi" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it-IT" className="antialiased">
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-bordo">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
            <Link href="/" className="text-lg font-bold">
              🎮 Il Platinatore
            </Link>
            <nav aria-label="Sezioni">
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {VOCI.map((v) => (
                  <li key={v.href}>
                    <Link href={v.href} className="hover:text-accento">
                      {v.testo}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-bordo">
          <div className="mx-auto flex max-w-3xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-tenue">
            <span>© Il Platinatore</span>
            <Link href="/privacy-policy/">Privacy Policy</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
