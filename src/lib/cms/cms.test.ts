import { afterEach, describe, expect, it } from "vitest";
import { noindex } from "./config";
import { decodificaEntita, percorsoArticolo } from "./mappa";
import { numeroPagina } from "./pagina";
import { sanificaHtml } from "./sanitize";
import { jsonLd, riportaInProfondita, riportaSuPubblico } from "./seo";

const CMS = "https://cms.ilplatinatore.it";
const PUB = "https://www.ilplatinatore.it";

describe("indirizzi", () => {
  it("usa la data LOCALE di WordPress, non quella UTC", () => {
    // pubblicato all'01:30 ora del sito (+2): in UTC sarebbe il giorno prima
    expect(percorsoArticolo("2026-10-15T01:30:00", "guida")).toBe("/2026/10/15/guida/");
  });
  it("le pagine d'archivio accettano solo numeri", () => {
    expect(numeroPagina("2")).toBe(2);
    expect(numeroPagina("0")).toBeNull();
    expect(numeroPagina("abc")).toBeNull();
    expect(numeroPagina("99999")).toBeNull();
  });
});

describe("riscrittura degli URL del CMS", () => {
  it("riporta link e immagini sul dominio pubblico, http o https", () => {
    const html = `<a href="${CMS}/2026/10/15/x/">x</a><img src="http://cms.ilplatinatore.it/wp-content/uploads/a.jpg">`;
    const r = riportaSuPubblico(html, CMS, PUB);
    expect(r).not.toContain("cms.ilplatinatore.it");
    expect(r).toContain(`${PUB}/2026/10/15/x/`);
    expect(r).toContain(`${PUB}/wp-content/uploads/a.jpg`);
  });
  it("riporta anche gli URL con le barre scappate dentro il JSON dello schema", () => {
    const schema = { "@graph": [{ url: `${CMS}/2026/10/15/x/`, image: { url: `${CMS}/wp-content/uploads/a.jpg` } }] };
    const r = JSON.stringify(riportaInProfondita(schema, CMS, PUB));
    expect(r).not.toContain("cms.ilplatinatore.it");
    expect(r).toContain(`${PUB}/2026/10/15/x/`);
  });
  it("non tocca gli altri domini", () => {
    expect(riportaSuPubblico("https://www.powerpyx.com/a/", CMS, PUB)).toBe("https://www.powerpyx.com/a/");
  });
});

describe("sanificazione", () => {
  it("toglie script e gestori di eventi", () => {
    const r = sanificaHtml(`<p onclick="x()">ciao</p><script>alert(1)</script>`);
    expect(r).toBe("<p>ciao</p>");
  });
  it("tiene YouTube, ma dal dominio senza cookie", () => {
    const r = sanificaHtml(`<iframe src="https://www.youtube.com/embed/abc" width="560"></iframe>`);
    expect(r).toContain("https://www.youtube-nocookie.com/embed/abc");
  });
  it("toglie gli iframe di qualsiasi altro dominio (incorporamenti del CMS)", () => {
    const r = sanificaHtml(`<iframe src="https://cms.ilplatinatore.it/2026/01/01/x/embed/"></iframe>`);
    expect(r).not.toContain("iframe");
  });
  it("niente h1 nel corpo: e' il titolo dell'articolo", () => {
    expect(sanificaHtml("<h1>doppio</h1>")).toBe("doppio");
  });
});

describe("testi e dati strutturati", () => {
  it("decodifica le entita' dei titoli", () => {
    expect(decodificaEntita("Cos&#8217;&egrave; il platino")).toBe("Cos’è il platino");
  });
  it("un titolo non puo' chiudere il tag dello schema", () => {
    const r = jsonLd({ headline: "</script><script>alert(1)</script>" });
    expect(r).not.toContain("</script>");
  });
});

describe("noindex", () => {
  const prima = process.env.SITO_NOINDEX;
  afterEach(() => {
    if (prima === undefined) delete process.env.SITO_NOINDEX;
    else process.env.SITO_NOINDEX = prima;
  });
  it("e' acceso se la variabile manca", () => {
    delete process.env.SITO_NOINDEX;
    expect(noindex()).toBe(true);
  });
  it("e' acceso con qualunque valore che non sia esattamente 0", () => {
    for (const v of ["", "false", "no", "1", "0 "]) {
      process.env.SITO_NOINDEX = v;
      expect(noindex()).toBe(true);
    }
  });
  it("si spegne solo con 0", () => {
    process.env.SITO_NOINDEX = "0";
    expect(noindex()).toBe(false);
  });
});

describe("titoli delle pagine d'archivio, come Yoast oggi", async () => {
  const { titoloPaginato } = await import("./metadati");
  it("home", () => {
    expect(titoloPaginato("🎮 Il Platinatore -", 2, 175)).toBe("🎮 Il Platinatore - Pagina 2 di 175 -");
  });
  it("tag e categoria", () => {
    expect(titoloPaginato("Crimson Desert Archivi - 🎮 Il Platinatore", 2, 31)).toBe(
      "Crimson Desert Archivi - Pagina 2 di 31 - 🎮 Il Platinatore",
    );
    expect(titoloPaginato("Guide Archivi - 🎮 Il Platinatore", 3, 158)).toBe("Guide Archivi - Pagina 3 di 158 - 🎮 Il Platinatore");
  });
  it("autore", () => {
    expect(titoloPaginato("ilplatinatore, Autore presso 🎮 Il Platinatore", 2, 175)).toBe(
      "ilplatinatore, Autore presso 🎮 Il Platinatore - Pagina 2 di 175",
    );
  });
});
