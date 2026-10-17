import type { Metadata, Viewport } from "next";
import { MisureClic } from "@/components/misure-clic";
import { Jost } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { robots } from "@/lib/cms/metadati";

// Nessuna pagina pubblica legge la richiesta (headers, cookies): renderebbe dinamico tutto il sito,
// e il primo articolo pubblicato dopo il build risponderebbe 500 (trappola del riferimento).

// Jost: il carattere del sito di oggi. next/font lo scarica al build e lo serve dal nostro
// dominio: nessuna richiesta a Google dal browser del lettore.
const jost = Jost({ subsets: ["latin", "latin-ext"], variable: "--font-jost", display: "swap" });

export const metadata: Metadata = {
  robots: robots(),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0d12" },
    { media: "(prefers-color-scheme: light)", color: "#f4f6fa" },
  ],
};

const VOCI = [
  { href: "/category/guide/", testo: "Guide" },
  { href: "/category/news/", testo: "News" },
  { href: "/category/approfondimenti/", testo: "Approfondimenti" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it-IT" className={`${jost.variable} antialiased`}>
      <body className="flex min-h-screen flex-col">
        <header className="border-b border-linea">
          <div className="striscia" aria-hidden="true" />
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4">
            <Link href="/" className="flex min-h-11 items-center text-lg font-bold">
              Il Platinatore
            </Link>
            <nav aria-label="Sezioni">
              <ul className="flex">
                {VOCI.map((v) => (
                  <li key={v.href}>
                    <Link href={v.href} className="flex min-h-11 items-center px-2 text-sm font-medium text-tenue hover:text-testo">
                      {v.testo}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">{children}</main>
        <MisureClic />
        <footer className="border-t border-linea">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-sm text-tenue">
            <span>© Il Platinatore</span>
            <Link href="/privacy-policy/" className="flex min-h-11 items-center">
              Privacy Policy
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
