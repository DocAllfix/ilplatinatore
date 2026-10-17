import { describe, expect, it } from "vitest";
import { descrizioneTag, schedaDaDescrizione } from "./scheda-gioco";

describe("schedaDaDescrizione", () => {
  it("legge le righe come le scrive wpvibe, anche con il grassetto e i paragrafi di WordPress", () => {
    const d =
      "<p><b>Anno:</b> 2026<br />Genere: Soulslike in prima persona<br />Voto medio: 82<br />Storia: 15 ore<br />Storia + extra: 25 ore<br />Completista: 40 ore</p>";
    expect(schedaDaDescrizione(d)).toEqual({
      anno: "2026",
      genere: "Soulslike in prima persona",
      voto: "82",
      storia: "15 ore",
      extra: "25 ore",
      completista: "40 ore",
    });
  });
  it("accetta varianti delle etichette e ignora il resto", () => {
    const s = schedaDaDescrizione("Anno di distribuzione: 2019\nRecensioni medie: 85/100\nUna frase senza due punti\nDurata storia: 18 ore\nColore: blu");
    expect(s).toEqual({ anno: "2019", voto: "85/100", storia: "18 ore" });
  });
  it("una descrizione in prosa non e' una scheda", () => {
    expect(schedaDaDescrizione("<b>Arc Raiders</b> trasporta i giocatori in una Terra post-apocalittica dove la sopravvivenza dipende.")).toBeNull();
    expect(schedaDaDescrizione("")).toBeNull();
    expect(schedaDaDescrizione(undefined)).toBeNull();
  });
  it("niente trattini lunghi", () => {
    expect(schedaDaDescrizione("Storia: 15 – 20 ore")?.storia).toBe("15-20 ore");
  });
});

describe("descrizioneTag", () => {
  it("frase per i motori con genere e anno se ci sono", () => {
    expect(descrizioneTag("Valor Mortis", { genere: "Soulslike", anno: "2026" })).toBe(
      "Guide, trofei e news su Valor Mortis (Soulslike, 2026): tutti gli articoli del Platinatore.",
    );
    expect(descrizioneTag("Balatro", null)).toBe("Guide, trofei e news su Balatro: tutti gli articoli del Platinatore.");
  });
});
