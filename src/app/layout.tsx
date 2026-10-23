import type { Metadata, Viewport } from "next";
import { MisureClic } from "@/components/misure-clic";
import { Testata } from "@/components/testata/testata";
import { RichiamoSfida } from "@/components/sfida/richiamo";
import { PubblicitaScript } from "@/components/pubblicita-script";
import { VitaliWeb } from "@/components/vitali-web";
import { Jost } from "next/font/google";
import Link from "@/components/collegamento";
import "./globals.css";
import { robotsConDopo } from "@/lib/cms/metadati";

// Nessuna pagina pubblica legge la richiesta (headers, cookies): renderebbe dinamico tutto il sito,
// e il primo articolo pubblicato dopo il build risponderebbe 500 (trappola del riferimento).

// Jost: il carattere del sito di oggi. next/font lo scarica al build e lo serve dal nostro
// dominio: nessuna richiesta a Google dal browser del lettore.
const jost = Jost({ subsets: ["latin", "latin-ext"], variable: "--font-jost", display: "swap" });

export const metadata: Metadata = {
  ...robotsConDopo(),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0d12" },
    { media: "(prefers-color-scheme: light)", color: "#f4f6fa" },
  ],
};

// Il tema scelto col tasto in testata si applica PRIMA del primo disegno: niente lampo di tema
// sbagliato. Senza scelta salvata vale quello del telefono. try/catch: senza memoria si va avanti.
const TEMA = `try{var t=localStorage.getItem("platinatore:tema");if(t==="light"||t==="dark"){document.documentElement.dataset.theme=t}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it-IT" className={`${jost.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA }} />
        {/* la versione del codice pubblicata: la usa il controllo dopo ogni pubblicazione su GitHub */}
        <meta name="platinatore-versione" content={process.env.VERCEL_GIT_COMMIT_SHA ?? "locale"} />
      </head>
      <body className="flex min-h-screen flex-col">
        <Testata />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-5">{children}</main>
        <MisureClic />
        <RichiamoSfida />
        {/* la pubblicita' sta solo negli articoli (decisione del proprietario, 23/10/2026): lo script di HB
            parte solo dove la pagina ha i suoi spazi */}
        <PubblicitaScript />
        <VitaliWeb />
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
