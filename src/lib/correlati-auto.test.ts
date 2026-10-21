import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { correlatiAutomatici, sceltaCorrelati, type ArticoloLeggero } from "./correlati-auto";
import { leggiRegistro } from "./registro-hub";

const R = leggiRegistro(readFileSync("infra/cms/registro-hub.txt", "utf8"));
const guida = (slug: string, titolo: string, data: string, cat = "guide"): ArticoloLeggero => ({ slug, titolo, data, categorie: [{ slug: cat }] });

describe("scelta dei correlati automatici", () => {
  const altri = [
    guida("consigli", "Valor Mortis: come usare lo Scudo", "2026-10-10"),
    guida("platino", "Valor Mortis: guida al Platino, tutti i 39 trofei e roadmap completa", "2026-10-01"),
    guida("mancabile", "Valor Mortis: come ottenere Sfratto Abissale e non perdere il trofeo mancabile", "2026-10-05"),
    guida("boss", "Valor Mortis: come battere l’Orfano, due fasi e attacchi imparabili", "2026-10-08"),
    guida("news", "Valor Mortis: arriva la patch 1.2", "2026-10-12", "news"),
    guida("recensione", "Valor Mortis – Recensione", "2026-10-02", "recensioni"),
  ];

  it("i primi tre nell'ordine approvato: Platino, recensione, trofeo mancabile", () => {
    expect(sceltaCorrelati(altri, { gioco: "Valor Mortis", registro: R })).toEqual([
      { slug: "platino", tipo: "Guida al Platino" },
      { slug: "recensione", tipo: "La nostra recensione" },
      { slug: "mancabile", tipo: "Trofeo mancabile" },
    ]);
  });
  it("senza Platino e recensione arrivano boss e ultima news", () => {
    const s = sceltaCorrelati(altri.filter((a) => a.slug !== "platino" && a.slug !== "recensione"), { gioco: "Valor Mortis", registro: R });
    expect(s.map((x) => x.tipo)).toEqual(["Trofeo mancabile", "Boss complicato", "L’ultima news"]);
  });
  it("quando mancano i tipi, «Leggi anche» con la guida aggiornata piu' di recente", () => {
    const s = sceltaCorrelati([guida("a", "Gioco: una guida", "2026-10-01"), guida("b", "Gioco: altra guida", "2026-10-09")], { gioco: "Gioco", registro: R });
    expect(s).toEqual([
      { slug: "b", tipo: "Leggi anche" },
      { slug: "a", tipo: "Leggi anche" },
    ]);
  });
  it("un tag che non e' un gioco: solo «Leggi anche», anche dalle news", () => {
    expect(sceltaCorrelati([guida("n", "PS5: novita'", "2026-10-01", "news")], { gioco: null, registro: R })).toEqual([{ slug: "n", tipo: "Leggi anche" }]);
  });
});

describe("posizione dei correlati", () => {
  const scelte = [
    { slug: "x", tipo: "Guida al Platino" },
    { slug: "y", tipo: "Leggi anche" },
    { slug: "z", tipo: "Leggi anche" },
  ];
  it("uno ogni due sezioni, al massimo tre", () => {
    expect(correlatiAutomatici(["a", "b", "c", "d", "e", "f", "g", "h"], scelte).map((c) => [c.dopo, c.articolo, c.tipo])).toEqual([
      ["b", "x", "Guida al Platino"],
      ["d", "y", "Leggi anche"],
      ["f", "z", "Leggi anche"],
    ]);
  });
  it("mai nell'ultima sezione: il posto passa a quella prima", () => {
    expect(correlatiAutomatici(["a", "b", "c", "d"], scelte).map((c) => c.dopo)).toEqual(["b", "c"]);
    expect(correlatiAutomatici(["a", "b"], scelte)).toEqual([]);
  });
});

describe("articoli senza tag", () => {
  it("lo stesso nome nel titolo, altrimenti la stessa categoria", async () => {
    const { altriSenzaTag, giocoDalTitolo } = await import("./correlati-auto");
    expect(giocoDalTitolo("Castlevania: Belmont’s Curse, tutti i boss")).toBe("Castlevania");
    const tutti = [
      guida("cv", "Castlevania: armi e reliquie", "2026-10-15"),
      guida("altro", "Hades 2: guida", "2026-10-10"),
    ];
    expect(altriSenzaTag("Castlevania: guida per principianti", "guide", tutti)).toEqual({ altri: [tutti[0]], gioco: "Castlevania" });
    expect(altriSenzaTag("Un titolo senza due punti", "guide", tutti).altri).toHaveLength(2);
  });
});
