import { describe, expect, it } from "vitest";
import { sanificaHtml } from "../cms/sanitize";
import { aggiungiAncore, dividiCorpo, estraiChecklist } from "./checklist";

const HTML = sanificaHtml(`<p>Intro</p>
<h2>Tutti i trofei dei boss e della storia</h2><p>Spiegazione.</p>
<figure class="wp-block-table"><table><thead><tr><th>Trofeo</th><th>Come ottenerlo</th></tr></thead><tbody>
<tr><td>Torn Banner</td><td>Sconfiggere General Lothaire</td></tr>
<tr><td>Not a Cat Person</td><td>Sconfiggere la Sphinx</td></tr></tbody></table></figure>
<h2>Arsenal Absolute: tutte le armi</h2>
<figure class="wp-block-table"><table><tr><th>Tipo</th><th>Equipaggiamento</th></tr><tr><td>Mischia</td><td>Saber</td></tr></table></figure>
<h2>Missioni secondarie</h2>
<figure class="wp-block-table"><table><tr><th>Trofeo</th><th>Missione</th><th>Regione iniziale</th></tr>
<tr><td>A Bitter Cure</td><td>Laudanum</td><td>The Outskirts</td></tr></table></figure>
<p>Fine.</p>`);

describe("checklist dalle tabelle di trofei", () => {
  const { gruppi, corpo } = estraiChecklist(HTML);

  it("prende solo le tabelle che iniziano con «Trofeo»", () => {
    expect(gruppi.map((g) => g.titolo)).toEqual(["Tutti i trofei dei boss e della storia", "Missioni secondarie"]);
    expect(corpo).toContain("Saber"); // la tabella delle armi resta nel testo
  });

  it("legge nome e dettagli con le intestazioni come etichette", () => {
    expect(gruppi[0].voci.map((v) => v.nome)).toEqual(["Torn Banner", "Not a Cat Person"]);
    expect(gruppi[1].voci[0].dettagli).toEqual([
      { etichetta: "Missione", valore: "Laudanum" },
      { etichetta: "Regione iniziale", valore: "The Outskirts" },
    ]);
  });

  it("lascia un segnaposto al posto della tabella e il resto intatto, nell'ordine", () => {
    const pezzi = dividiCorpo(corpo);
    expect(pezzi.filter((p) => "gruppo" in p).map((p) => ("gruppo" in p ? p.gruppo : ""))).toEqual(gruppi.map((g) => g.id));
    expect(corpo).not.toContain("Torn Banner");
    expect(corpo).toContain("Fine.");
  });

  it("id dei trofei stabili e unici (servono a ritrovare le spunte salvate)", () => {
    const ids = gruppi.flatMap((g) => g.voci.map((v) => v.id));
    expect(ids).toEqual(["torn-banner", "not-a-cat-person", "a-bitter-cure"]);
  });
});

describe("ancore dei titoli", () => {
  it("da' un id a ogni h2 e h3 e fa l'indice degli h2", () => {
    const { html, indice } = aggiungiAncore(`<h2>Roadmap per il Platino</h2><h3>Fase 1</h3><h2>Roadmap per il Platino</h2>`);
    expect(indice).toEqual([
      { id: "roadmap-per-il-platino", testo: "Roadmap per il Platino" },
      { id: "roadmap-per-il-platino-2", testo: "Roadmap per il Platino" },
    ]);
    expect(html).toContain('<h3 id="fase-1">');
  });
});

describe("piu' tabelle di trofei sotto lo stesso titolo (parita' del 20/10/2026, Hellraiser Revival)", () => {
  it("ogni tabella e' un gruppo suo, con il suo h3 e un id diverso", () => {
    const tab = (nome: string) => `<figure class="wp-block-table"><table><thead><tr><th>Trofeo</th><th>Come ottenerlo</th></tr></thead><tbody><tr><td>${nome}</td><td>x</td></tr></tbody></table></figure>`;
    const html = `<h2>Lista dei trofei</h2><h3>Trofeo di platino</h3>${tab("To Hell and Back")}<h3>Trofei d’oro</h3>${tab("Come Here, Damn You")}<h3>Trofei d’argento</h3>${tab("Lord of War")}<h3>Trofei di bronzo</h3>${tab("Codebreaker")}`;
    const { gruppi, corpo } = estraiChecklist(sanificaHtml(html));
    expect(gruppi.map((g) => [g.titolo, g.voci[0].nome])).toEqual([
      ["Trofeo di platino", "To Hell and Back"],
      ["Trofei d’oro", "Come Here, Damn You"],
      ["Trofei d’argento", "Lord of War"],
      ["Trofei di bronzo", "Codebreaker"],
    ]);
    expect(new Set(gruppi.map((g) => g.id)).size).toBe(4);
    expect(dividiCorpo(corpo).filter((p) => "gruppo" in p)).toHaveLength(4);
  });
  it("titoli uguali: id diversi lo stesso", () => {
    const t = `<table><tr><th>Trofeo</th></tr><tr><td>A</td></tr></table>`;
    const { gruppi } = estraiChecklist(`<h2>Trofei</h2>${t}${t.replace(">A<", ">B<")}`);
    expect(gruppi.map((g) => g.id)).toEqual(["checklist-trofei", "checklist-trofei-2"]);
  });
});
