import { describe, expect, it } from "vitest";
import { condivisione, confronta, lettere, parolaDelGiorno, schema, tastiera, type Parola } from "./parola";

describe("lettere e schema", () => {
  it("toglie accenti e separatori; i pezzi diventano la griglia", () => {
    expect(lettere("T’rukan")).toBe("TRUKAN");
    expect(lettere("Pokémon")).toBe("POKEMON");
    expect(schema("Lord Saito")).toEqual([4, 5]);
    expect(schema("Kang-jin Loong")).toEqual([4, 3, 5]);
  });
  it("non si giocano cifre, nomi troppo corti o troppo lunghi", () => {
    expect(schema("007 First Light")).toBeNull();
    expect(schema("Ato")).toBeNull();
    expect(schema("Capitano Raphael del Nephtis")).toBeNull();
  });
});

describe("confronto di Wordle", () => {
  it("giuste, presenti e assenti", () => {
    expect(confronta("CAPCOM", "COMPAC")).toEqual(["giusta", "presente", "presente", "presente", "presente", "presente"]);
    expect(confronta("REMEDY", "RXXXXX")).toEqual(["giusta", "assente", "assente", "assente", "assente", "assente"]);
  });
  it("lettere doppie come l'originale: una sola E presente se il segreto ne ha una libera", () => {
    // REMEDY ha una sola E libera dopo quella giusta in seconda posizione: la prima E e' presente, la terza assente
    expect(confronta("REMEDY", "EEEXXX")).toEqual(["presente", "giusta", "assente", "assente", "assente", "assente"]);
    expect(confronta("ABCDE", "AAAAA")).toEqual(["giusta", "assente", "assente", "assente", "assente"]);
  });
  it("la tastiera tiene il colore migliore di ogni lettera", () => {
    const k = tastiera("CAPCOM", ["COMPAC", "CAXXXX"]);
    expect(k.C).toBe("giusta");
    expect(k.O).toBe("presente");
    expect(k.X).toBe("assente");
  });
});

describe("parola del giorno e condivisione", () => {
  const elenco: Parola[] = [
    { livello: "facile", nome: "Cuphead", gioco: { nome: "Cuphead", slug: "cuphead" } },
    { livello: "facile", nome: "Balatro", gioco: { nome: "Balatro", slug: "balatro" } },
    { livello: "facile", nome: "007 First Light", gioco: { nome: "007 First Light", slug: "007-first-light" } },
    { livello: "medio", nome: "Remedy", gioco: { nome: "Control Resonant", slug: "control-resonant" } },
  ];
  it("stessa parola per tutti nello stesso giorno, solo nomi giocabili, si passa per tutte", () => {
    const a = parolaDelGiorno(20380, "facile", elenco)!;
    expect(parolaDelGiorno(20380, "facile", elenco)).toEqual(a);
    const due = new Set([parolaDelGiorno(20380, "facile", elenco)!.nome, parolaDelGiorno(20381, "facile", elenco)!.nome]);
    expect(due).toEqual(new Set(["Cuphead", "Balatro"]));
    expect(parolaDelGiorno(20380, "difficile", elenco)).toBeNull();
  });
  it("riga da condividere senza la soluzione", () => {
    const t = condivisione(3, "medio", "Remedy", ["RXXXXX", "REMEDY"], true);
    expect(t).toBe("Il Platinatore · La parola #3 · Medio 2/6\n🟩🟪🟪🟪🟪🟪\n🟩🟩🟩🟩🟩🟩");
    expect(t).not.toContain("REMEDY");
  });
});

describe("elenco delle parole", () => {
  it("facile dagli hub, medio e difficile dal CMS; righe senza gioco valido saltate", async () => {
    const { leggiParole } = await import("./parola");
    const giochi = new Map([["control-resonant", "Control Resonant"], ["cuphead", "Cuphead"]]);
    const p = leggiParole("# nota\nmedio | Remedy | control-resonant\ndifficile | Hedron | control-resonant\nmedio | X | gioco-che-non-c-e\nboh | Y | cuphead\n", giochi);
    expect(p.map((x) => [x.livello, x.nome, x.gioco.slug])).toEqual([
      ["facile", "Control Resonant", "control-resonant"],
      ["facile", "Cuphead", "cuphead"],
      ["medio", "Remedy", "control-resonant"],
      ["difficile", "Hedron", "control-resonant"],
    ]);
  });
});
