import { describe, expect, it } from "vitest";
import {
  confrontaClassico,
  elementoDelTurno,
  formatoDelGiorno,
  giornoRoma,
  numeroSfida,
  quadretti,
  rigaDaCondividere,
  suggerimenti,
  type Classico,
} from "./sfida";

describe("giorno e rotazione", () => {
  it("il giorno cambia a mezzanotte di Roma, non di Greenwich", () => {
    // 22:30 UTC del 17 ottobre = 00:30 del 18 a Roma (ora legale)
    expect(giornoRoma(new Date("2026-10-17T22:30:00Z"))).toBe(giornoRoma(new Date("2026-10-18T12:00:00Z")));
    expect(numeroSfida(giornoRoma(new Date("2026-10-17T10:00:00Z")))).toBe(1);
  });
  it("i formati ruotano e quelli senza dati si saltano", () => {
    const g = giornoRoma(new Date("2026-10-17T10:00:00Z"));
    expect([0, 1, 2, 3].map((i) => formatoDelGiorno(g + i, ["gioco", "trofeo", "classico"]))).toEqual(["gioco", "trofeo", "classico", "gioco"]);
    expect([0, 1, 2].map((i) => formatoDelGiorno(g + i, ["gioco", "classico"]))).toEqual(["gioco", "classico", "gioco"]);
    expect(formatoDelGiorno(g, [])).toBeNull();
  });
  it("si passa per tutti gli elementi prima di ripeterne uno", () => {
    const giro = Array.from({ length: 10 }, (_, k) => elementoDelTurno(k, 10, 1));
    expect(new Set(giro).size).toBe(10);
    // stesso turno, stessa risposta: uguale per tutti
    expect(elementoDelTurno(3, 10, 1)).toBe(elementoDelTurno(3, 10, 1));
  });
});

describe("risposte", () => {
  it("suggerimenti senza badare a maiuscole e accenti", () => {
    const elenco = ["Pokémon GO", "Pokémon Pokopia", "Saros", "Hades II"];
    expect(suggerimenti("poke", elenco)).toEqual(["Pokémon GO", "Pokémon Pokopia"]);
    expect(suggerimenti("des", elenco)).toEqual(["Hades II"]);
    expect(suggerimenti("", elenco)).toEqual([]);
  });
});

describe("confrontaClassico", () => {
  const mgs: Classico = { nome: "Metal Gear Solid", anno: 1998, piattaforme: ["PS1"], sviluppatore: "Konami", genere: "Stealth", serie: "Metal Gear" };
  const sh: Classico = { nome: "Silent Hill", anno: 1999, piattaforme: ["PS1"], sviluppatore: "Konami", genere: "Survival horror", serie: "Silent Hill" };
  const tr: Classico = { nome: "Tomb Raider", anno: 1996, piattaforme: ["PS1", "Saturn", "PC"], sviluppatore: "Core Design", genere: "Azione-avventura", serie: "Tomb Raider" };
  const md: Classico = { nome: "MediEvil", anno: 1998, piattaforme: ["PS1"], sviluppatore: "SCE Cambridge Studio", genere: "Azione-avventura", serie: "MediEvil" };

  it("tutto giusto se e' lo stesso gioco", () => {
    expect(confrontaClassico(mgs, mgs)).toEqual({ anno: { esito: "giusto" }, piattaforme: "giusto", sviluppatore: "giusto", genere: "giusto", serie: "giusto" });
  });
  it("anno vicino con il verso, piattaforme in parte, genere in parte", () => {
    const c = confrontaClassico(mgs, sh);
    expect(c.anno).toEqual({ esito: "vicino", verso: "prima" });
    expect(c.sviluppatore).toBe("giusto");
    expect(confrontaClassico(md, tr).piattaforme).toBe("vicino");
    expect(confrontaClassico(md, tr).genere).toBe("giusto");
    expect(confrontaClassico(md, mgs).genere).toBe("sbagliato");
  });
});

describe("immagine e condivisione", () => {
  it("l'immagine si fa nitida a ogni errore e del tutto a fine partita", () => {
    expect(quadretti(0, false)).toBeGreaterThan(quadretti(3, false));
    expect(quadretti(9, false)).toBe(quadretti(4, false));
    expect(quadretti(2, true)).toBe(0);
  });
  it("la riga da condividere non contiene la soluzione", () => {
    expect(rigaDaCondividere(3, "gioco", [false, true], true)).toBe("Il Platinatore, sfida n. 3 (Riconosci il gioco): 🟥🟩 2/5");
    expect(rigaDaCondividere(3, "classico", Array(10).fill(false), false)).toContain("X/10");
  });
});

describe("opzioni e indizi", () => {
  it("le opzioni contengono la soluzione una volta sola e sono sempre le stesse per lo stesso seme", async () => {
    const { opzioniDelGiorno, nomeNascosto } = await import("./sfida");
    const elenco = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const o = opzioniDelGiorno("C", elenco, 6, 5);
    expect(o).toHaveLength(6);
    expect(o.filter((x) => x === "C")).toHaveLength(1);
    expect(opzioniDelGiorno("C", elenco, 6, 5)).toEqual(o);
    expect(nomeNascosto("Torn-Banner")).toBe("T_r_-B_n_e_");
  });
});
