import { describe, expect, it } from "vitest";
import { dividiCorpo } from "./guida/checklist";
import { classeArticolo, formatiFissi, inserisciAnnunci, MAGIC_DA_COMPUTER, MAGIC_DA_TELEFONO, paragrafiSostanziali, pianoNelTesto, PAROLE_FRA_ANNUNCI, tipoPagina } from "./annunci";

// un paragrafo di n parole
const par = (n: number, k = 0) => `<p>${Array.from({ length: n }, (_, i) => `parola${k}x${i}`).join(" ")}</p>`;
// un corpo di `quanti` paragrafi da `n` parole, con un titolo ogni tanto
const corpo = (quanti: number, n = 80) => Array.from({ length: quanti }, (_, i) => (i % 4 === 3 ? "<h2>Titolo</h2>" : "") + par(n, i)).join("\n");
const dove = (html: string) => Object.fromEntries(pianoNelTesto(html).posti.map((x) => [x.nome, x.paragrafo]));

describe("paragrafi sostanziali", () => {
  it("contano solo i <p> di primo livello con almeno 15 parole", () => {
    const html = [
      par(20),
      par(5), // di poche parole
      `<figure class="wp-block-table"><table><tr><td>${par(30)}</td></tr></table></figure>`,
      `<ul><li>${par(30)}</li></ul>`,
      `<blockquote>${par(30)}</blockquote>`,
      `<p><a href="/x/">${Array.from({ length: 20 }, () => "link").join(" ")}</a></p>`, // solo un link
      par(16),
    ].join("");
    expect(paragrafiSostanziali(html).map((p) => p.parole)).toEqual([20, 16]);
  });
});

describe("classe dell'articolo", () => {
  it("breve, media, lunga come le specifiche", () => {
    expect(classeArticolo(5, 600)).toBe("breve");
    expect(classeArticolo(5, 800)).toBe("media"); // pochi paragrafi ma lunghi
    expect(classeArticolo(10, 900)).toBe("media");
    expect(classeArticolo(14, 900)).toBe("lunga");
    expect(classeArticolo(9, 1700)).toBe("lunga");
  });
});

describe("pianoNelTesto", () => {
  it("guida lunga: Interscroller dopo il 3°, Outstream dopo l'8°, In Page dopo il 14°", () => {
    expect(dove(corpo(25))).toEqual({ Interscroller: 3, "Video Outstream": 8, "In Page": 14 });
  });
  it("articolo medio: Interscroller e Outstream (7°), niente In Page", () => {
    const { classe, posti } = pianoNelTesto(corpo(10));
    expect(classe).toBe("media");
    expect(posti.map((x) => [x.nome, x.paragrafo])).toEqual([["Interscroller", 3], ["Video Outstream", 7]]);
  });
  it("news breve: al massimo l'Interscroller, e solo se resta testo dopo", () => {
    expect(pianoNelTesto(corpo(6, 40)).classe).toBe("breve");
    expect(dove(corpo(6, 40))).toEqual({ Interscroller: 3 });
    expect(dove(corpo(6, 32))).toEqual({}); // dal 4° in poi non resta abbastanza testo dopo
    expect(dove(corpo(3, 40))).toEqual({}); // dopo il 3° non resta niente da leggere
  });
  it("mai a ridosso dell'inizio: con paragrafi corti si sposta piu' avanti", () => {
    expect(dove(corpo(12, 20)).Interscroller).toBe(6);
  });
  it("l'Outstream sta ad almeno PAROLE_FRA_ANNUNCI dall'Interscroller, o non c'e'", () => {
    const p = paragrafiSostanziali(corpo(25));
    const { posti } = pianoNelTesto(corpo(25));
    const parolePrima = (n: number) => p[n - 1].parolePrima;
    for (let i = 1; i < posti.length; i++) {
      expect(parolePrima(posti[i].paragrafo) - parolePrima(posti[i - 1].paragrafo)).toBeGreaterThanOrEqual(PAROLE_FRA_ANNUNCI);
    }
    // paragrafi corti: dal 7° all'11° non si raggiunge la distanza, quindi nessun Outstream
    expect(dove(corpo(13, 30))).toEqual({ Interscroller: 4 });
  });
  it("mai attaccato a un'altra scheda: salta il paragrafo seguito da un correlato", () => {
    const html = corpo(10).replace(par(80, 2), par(80, 2) + "<!--correlato:correlato-1-->");
    expect(dove(html).Interscroller).toBe(4);
  });
  it("ogni annuncio al massimo una volta", () => {
    for (const n of [3, 6, 10, 20, 40, 70]) {
      const ids = pianoNelTesto(corpo(n)).posti.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("inserisciAnnunci", () => {
  it("mette i segnaposto dopo i paragrafi scelti e il corpo si divide in testo e annunci", () => {
    const out = inserisciAnnunci(corpo(25));
    expect(out.match(/<!--annuncio:/g)).toHaveLength(3);
    expect(dividiCorpo(out).filter((x) => "annuncio" in x)).toEqual([{ annuncio: "304968" }, { annuncio: "345270" }, { annuncio: "304796" }]);
  });
});

describe("tipoPagina", () => {
  it("articoli, home e archivi; niente altrove", () => {
    expect(tipoPagina("/2026/10/26/dota-2-aumentare-fps-ridurre-lag/")).toBe("articolo");
    for (const a of ["/", "/page/2/", "/category/guide/", "/category/news/page/3/", "/tag/valor-mortis/", "/author/mario/", "/2025/", "/2025/03/", "/2025/03/07/", "/2025/03/page/2/"])
      expect(tipoPagina(a)).toBe("archivio");
    for (const n of ["/sfida/", "/sfida/parola/", "/ricerca/", "/privacy-policy/", "/feed/"]) expect(tipoPagina(n)).toBeNull();
  });
});

describe("formatiFissi", () => {
  const ids = (o: Parameters<typeof formatiFissi>[0]) => formatiFissi(o).map((x) => x.id);
  const stickyTelefono = MAGIC_DA_TELEFONO ? "304793" : "304792";
  it("telefono: un solo sticky e Interstitial, senza Interstitial col capping attivo", () => {
    expect(ids({ computer: false, margineMagic: false, consenso: true, capping: false })).toEqual([stickyTelefono, "304794"]);
    expect(ids({ computer: false, margineMagic: false, consenso: true, capping: true })).toEqual([stickyTelefono]);
  });
  it("telefono: niente Interstitial finche' la scelta nel banner del consenso non e' salvata", () => {
    expect(ids({ computer: false, margineMagic: false, consenso: false, capping: false })).toEqual([stickyTelefono]);
  });
  it("computer: un solo sticky; finche' HB non abilita il Magic da computer, il Floor", () => {
    expect(ids({ computer: true, margineMagic: true, consenso: true, capping: false })).toEqual([MAGIC_DA_COMPUTER ? "304793" : "304792"]);
    expect(ids({ computer: true, margineMagic: false, consenso: true, capping: false })).toEqual(["304792"]);
  });
});
