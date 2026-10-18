import { describe, expect, it } from "vitest";
import { sanificaHtml } from "../cms/sanitize";
import { estraiScheda } from "./scheda";

// La tabella vera della guida al platino di Valor Mortis, passata dalla sanificazione come in pagina.
const VALOR = sanificaHtml(`<p>Introduzione.</p>
<h2 class="wp-block-heading">Valor Mortis: informazioni sul Platino</h2>
<figure class="wp-block-table"><table class="has-fixed-layout"><thead><tr><th>Requisito</th><th>Dettaglio</th></tr></thead><tbody>
<tr><td>Trofei totali</td><td>39</td></tr><tr><td>Platino</td><td>1</td></tr><tr><td>Oro</td><td>3</td></tr>
<tr><td>Argento</td><td>14</td></tr><tr><td>Bronzo</td><td>21</td></tr><tr><td>Difficoltà stimata</td><td>5/10</td></tr>
<tr><td>Tempo per il Platino</td><td>15–25 ore</td></tr><tr><td>Partite minime</td><td>1</td></tr>
<tr><td>Trofei mancabili</td><td>1, Sfratto Abissale</td></tr><tr><td>Trofei online</td><td>0</td></tr>
<tr><td>Difficoltà selezionabile</td><td>No</td></tr><tr><td>Esplorazione dopo il finale</td><td>Sì</td></tr>
</tbody></table></figure>
<h2 class="wp-block-heading">Roadmap</h2><p>Testo.</p>
<figure class="wp-block-table"><table><tr><th>Trofeo</th><th>Come ottenerlo</th></tr><tr><td>Torn Banner</td><td>Sconfiggere Lothaire</td></tr></table></figure>`);

describe("scheda riassuntiva dalla tabella della guida", () => {
  const { scheda, corpo } = estraiScheda(VALOR);

  it("riconosce la tabella e legge i dati principali", () => {
    expect(scheda?.difficolta).toEqual({ voto: 5, massimo: 10 });
    expect(scheda?.tempo).toBe("15-25 ore"); // trattino normale, mai lungo
    expect(scheda?.partite).toBe("1");
    expect(scheda?.mancabili).toEqual({ numero: 1, nomi: "Sfratto Abissale" });
    expect(scheda?.online).toBe("0");
    expect(scheda?.trofei).toEqual({ totale: 39, platino: 1, oro: 3, argento: 14, bronzo: 21 });
  });

  it("tiene le voci senza posto fisso, nell'ordine della redazione", () => {
    expect(scheda?.altre.map((v) => v.etichetta)).toEqual(["Difficoltà selezionabile", "Esplorazione dopo il finale"]);
  });

  it("toglie dal corpo la tabella e il titolo che la introduce, non il resto", () => {
    expect(corpo).not.toContain("Trofei totali");
    expect(corpo).not.toContain("informazioni sul Platino");
    expect(corpo).toContain("Introduzione.");
    expect(corpo).toContain("Roadmap");
    expect(corpo).toContain("Torn Banner");
  });

  it("non scambia per scheda una tabella di trofei", () => {
    const r = estraiScheda(sanificaHtml(`<table><tr><td>Trofeo</td><td>Come</td></tr><tr><td>A</td><td>B</td></tr></table>`));
    expect(r.scheda).toBeNull();
  });

  it("dati parziali: le voci che mancano restano vuote, senza errori", () => {
    const r = estraiScheda(
      sanificaHtml(`<table><tr><td>Difficoltà stimata</td><td>3/10</td></tr><tr><td>Tempo per il Platino</td><td>8 ore</td></tr></table>`),
    );
    expect(r.scheda?.difficolta?.voto).toBe(3);
    expect(r.scheda?.mancabili).toBeUndefined();
    expect(r.scheda?.trofei).toBeUndefined();
  });
});

describe("soloOre (richiesta del proprietario, 18/10/2026)", () => {
  it("nel blocco giallo restano solo le ore, la spiegazione va a parte", async () => {
    const { soloOre } = await import("./scheda");
    expect(soloOre("60-80 ore (A seconda della fortuna con la generazione procedurale e del farming di risorse).")).toEqual({
      ore: "60-80 ore",
      resto: "A seconda della fortuna con la generazione procedurale e del farming di risorse.",
    });
    expect(soloOre("15-25 ore")).toEqual({ ore: "15-25 ore" });
    expect(soloOre("Circa 40 ore")).toEqual({ ore: "40 ore", resto: "Circa" });
    expect(soloOre("Non indicato")).toEqual({ ore: "Non indicato" });
  });
});
