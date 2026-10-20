import { describe, expect, it } from "vitest";
import { dividiCorpo } from "./guida/checklist";
import { correlatiAutomatici, estraiVerdetto, fascia, SEGNAPOSTO_VERDETTO, votoDaMeta, votoTesto } from "./recensione";

// il verdetto di Control Resonant come lo rende il CMS (uguale al sito su Aruba)
const HTML = `<p>prima</p>
<h3>Verdetto</h3>
<div class="platinatore-voto" role="img" aria-label="Voto 7,5 su 10"><span class="platinatore-voto__numero">7,5</span><span class="platinatore-voto__scala">/10</span></div>
<p>Control Resonant ha <strong>limiti evidenti</strong> nel bilanciamento.</p>
<p>Seconda frase del verdetto.</p>
<div class="altro">dopo</div>`;

describe("verdetto", () => {
  it("stacca voto, titolo e paragrafi del verdetto e lascia il segnaposto", () => {
    const r = estraiVerdetto(HTML);
    expect(r.voto).toEqual({ valore: 7.5, scala: 10 });
    expect(r.titolo).toBe("Verdetto");
    expect(r.verdetto).toBe("<p>Control Resonant ha <strong>limiti evidenti</strong> nel bilanciamento.</p>\n<p>Seconda frase del verdetto.</p>");
    expect(r.corpo).toBe(`<p>prima</p>\n${SEGNAPOSTO_VERDETTO}\n<div class="altro">dopo</div>`);
    expect(dividiCorpo(r.corpo).filter((p) => "verdetto" in p)).toHaveLength(1);
  });
  it("senza voto il testo resta com'e'", () => {
    expect(estraiVerdetto("<p>niente</p>")).toEqual({ voto: null, titolo: "", verdetto: "", corpo: "<p>niente</p>" });
  });
  it("un titolo che non parla di verdetto resta nel testo", () => {
    const r = estraiVerdetto(HTML.replace("<h3>Verdetto</h3>", "<h3>Comparto tecnico</h3>"));
    expect(r.titolo).toBe("Il verdetto");
    expect(r.corpo).toContain("<h3>Comparto tecnico</h3>");
  });
});

describe("voto", () => {
  it("fasce come su IGN, sul voto riportato a 10", () => {
    expect(fascia({ valore: 8, scala: 10 })).toBe("alta");
    expect(fascia({ valore: 7.5, scala: 10 })).toBe("media");
    expect(fascia({ valore: 5.9, scala: 10 })).toBe("bassa");
    expect(fascia({ valore: 85, scala: 100 })).toBe("alta");
  });
  it("virgola italiana e campi del CMS", () => {
    expect(votoTesto(7.5)).toBe("7,5");
    expect(votoTesto(8)).toBe("8");
    expect(votoDaMeta({ pl_voto: "7.5", pl_voto_scala: "10" })).toEqual({ valore: 7.5, scala: 10 });
    expect(votoDaMeta({ pl_voto: "" })).toBeNull();
    expect(votoDaMeta(undefined)).toBeNull();
  });
});

describe("correlati automatici", () => {
  it("mai nell'ultima sezione (chiude col verdetto): il posto passa alla sezione prima", () => {
    // Control Resonant: 4 sezioni, dopo la 2a e (invece che dopo la 4a, l'ultima) dopo la 3a
    expect(correlatiAutomatici(["a", "b", "c", "d"], [{ slug: "x" }, { slug: "y" }], null).map((x) => x.dopo)).toEqual(["b", "c"]);
  });
  it("uno ogni due sezioni, prima la guida al Platino, al massimo tre", () => {
    const c = correlatiAutomatici(["a", "b", "c", "d", "e", "f", "g", "h"], [{ slug: "x" }, { slug: "p" }, { slug: "y" }, { slug: "z" }], { slug: "p" });
    expect(c.map((x) => [x.dopo, x.articolo, x.tipo])).toEqual([
      ["b", "p", "Guida al Platino"],
      ["d", "x", "Leggi anche"],
      ["f", "y", "Leggi anche"],
    ]);
  });
  it("con poche sezioni o poche guide se ne mettono meno", () => {
    expect(correlatiAutomatici(["a", "b", "c"], [{ slug: "x" }, { slug: "y" }], null).map((x) => x.articolo)).toEqual(["x"]);
    expect(correlatiAutomatici(["a", "b"], [{ slug: "x" }], null)).toEqual([]);
    expect(correlatiAutomatici(["a"], [{ slug: "x" }], null)).toEqual([]);
  });
});

describe("il corpo della recensione resta intero (20/10/2026)", () => {
  it("con piu' titoli prima del verdetto si toglie solo il titolo «Verdetto»", () => {
    const html = `<p>intro</p><h2>Storia</h2><p>a</p><h2>Combattimento</h2><p>b</p>${HTML}`;
    const r = estraiVerdetto(html);
    expect(r.corpo).toContain("<h2>Storia</h2><p>a</p><h2>Combattimento</h2><p>b</p>");
    expect(r.corpo).not.toContain("<h3>Verdetto</h3>");
    expect(r.titolo).toBe("Verdetto");
  });
});
