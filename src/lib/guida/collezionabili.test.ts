import { describe, expect, it } from "vitest";
import { aggiungiAncore, dividiCorpo } from "./checklist";
import { collezionabiliDaCampi, collocaCorrelati, correlatiDaCampi, plurale } from "./collezionabili";

describe("collezionabiliDaCampi", () => {
  const ancore = new Set(["prima-ambra-bottomless-well"]);

  it("legge le righe, scarta quelle senza nome e collega solo le sezioni che esistono", () => {
    const v = collezionabiliDaCampi(
      {
        pl_collezionabili: [
          { area: "Battlefield", oggetto: "Bottomless Well", tipo: "Ambra", sezione: "Prima Ambra: Bottomless Well", prerequisito: "Fuoco" },
          { area: "Battlefield", oggetto: "", tipo: "Ambra" },
          { area: "Trincee", oggetto: "Iron Grip", tipo: "Ambra", sezione: "Titolo che non c'è", spoiler: "si" },
        ],
      },
      ancore,
    );
    expect(v.map((x) => x.oggetto)).toEqual(["Bottomless Well", "Iron Grip"]);
    expect(v[0].ancora).toBe("prima-ambra-bottomless-well");
    expect(v[1].ancora).toBeNull();
    expect(v[1].spoiler).toBe(true);
    expect(v[0].id.startsWith("c-")).toBe(true);
  });

  it("da' id unici a oggetti con lo stesso nome nella stessa area", () => {
    const riga = { area: "Marketplace", oggetto: "Potenza del Ferrofluido", tipo: "Potenziamento" };
    const v = collezionabiliDaCampi({ pl_collezionabili: [riga, riga] }, ancore);
    expect(new Set(v.map((x) => x.id)).size).toBe(2);
  });

  it("senza campi non restituisce niente", () => {
    expect(collezionabiliDaCampi(undefined, ancore)).toEqual([]);
    expect(collezionabiliDaCampi({ pl_collezionabili: "rotto" }, ancore)).toEqual([]);
  });

  it("plurale dei tipi noti, il resto com'e'", () => {
    expect(plurale("Ambra")).toBe("Ambre");
    expect(plurale("Reliquia")).toBe("Reliquia");
  });
});

describe("correlati", () => {
  const corpo = aggiungiAncore("<h2>Roadmap</h2><p>a</p><h2>Sfratto Abissale</h2><p>b</p><h2>Boss</h2><p>c</p>").html;

  it("accettano lo slug o l'indirizzo intero", () => {
    const c = correlatiDaCampi({
      pl_correlati: [
        { tipo: "Prima di continuare", articolo: "https://www.ilplatinatore.it/2026/10/01/guida-sfratto/", perche: "x", dopo_sezione: "Roadmap" },
        { tipo: "", articolo: "", dopo_sezione: "Boss" },
      ],
    });
    expect(c).toHaveLength(1);
    expect(c[0].articolo).toBe("guida-sfratto");
    expect(c[0].dopo).toBe("roadmap");
  });

  it("vanno alla fine della sezione, prima dell'h2 successivo; in fondo se e' l'ultima", () => {
    const c = correlatiDaCampi({
      pl_correlati: [
        { tipo: "Prossimo obiettivo", articolo: "b", dopo_sezione: "Boss" },
        { tipo: "Prima di continuare", articolo: "a", dopo_sezione: "Roadmap" },
        { tipo: "Fantasma", articolo: "z", dopo_sezione: "Non esiste" },
      ],
    });
    const { html, collocati } = collocaCorrelati(corpo, c);
    expect(collocati.map((x) => x.articolo)).toEqual(["b", "a"]);
    expect(html).toContain('<p>a</p><!--correlato:correlato-2--><h2 id="sfratto-abissale">');
    expect(html.endsWith("<p>c</p><!--correlato:correlato-1-->")).toBe(true);
    const pezzi = dividiCorpo(html);
    expect(pezzi.filter((p) => "correlato" in p)).toHaveLength(2);
  });
});
