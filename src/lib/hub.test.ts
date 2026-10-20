import { describe, expect, it } from "vitest";
import { descrizioneHub, giocoDaMeta } from "./hub";

describe("giocoDaMeta", () => {
  it("i campi del gioco sono facoltativi: senza, dati vuoti (l'hub c'e' lo stesso)", () => {
    expect(giocoDaMeta(undefined)).toEqual({ presentazione: "", piattaforme: [], uscita: undefined, sviluppatore: undefined, editore: undefined, guidaPlatino: undefined, iniziaQui: [] });
  });
  it("legge piattaforme, uscita e slug (anche da indirizzi interi)", () => {
    const g = giocoDaMeta({
      pl_piattaforme: "PS5, Xbox Series X|S , PC",
      pl_uscita: "13/10/2026",
      pl_guida_platino: "https://www.ilplatinatore.it/2026/10/13/guida-platino/",
      pl_inizia_qui: "uno\n\n due \n",
    });
    expect(g.piattaforme).toEqual(["PS5", "Xbox Series X|S", "PC"]);
    expect(g.uscita).toBeUndefined();
    expect(g.guidaPlatino).toBe("guida-platino");
    expect(g.iniziaQui).toEqual(["uno", "due"]);
  });
});

describe("descrizione", () => {
  it("descrizione sotto i 160 caratteri, tagliata su una parola", () => {
    const d = descrizioneHub({ presentazione: "parola ".repeat(40), piattaforme: [], iniziaQui: [] }, "X", []);
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith("…")).toBe(true);
  });
});

describe("senzaGioco", () => {
  it("toglie il nome del gioco e rimette la maiuscola", async () => {
    const { senzaGioco } = await import("./hub");
    expect(senzaGioco("Valor Mortis: come sbloccare il viaggio rapido")).toBe("Come sbloccare il viaggio rapido");
    expect(senzaGioco("Senza due punti")).toBe("Senza due punti");
  });
});

describe("copertinaHub", () => {
  it("prima la guida al Platino, poi la guida piu' recente con un'immagine, altrimenti niente", async () => {
    const { copertinaHub } = await import("./hub");
    type G = { immagine?: string; data: string };
    const vecchia: G = { immagine: "vecchia", data: "2026-10-01T10:00:00Z" };
    const recente: G = { immagine: "recente", data: "2026-10-15T10:00:00Z" };
    const senza: G = { data: "2026-10-20T10:00:00Z" };
    expect(copertinaHub<string, G>({ immagine: "platino", data: "2026-09-01" }, [recente])).toBe("platino");
    expect(copertinaHub(null, [vecchia, senza, recente])).toBe("recente");
    expect(copertinaHub<string, G>({ data: "x" }, [vecchia])).toBe("vecchia");
    expect(copertinaHub(null, [senza])).toBeUndefined();
  });
});

describe("guidaPlatinoDalTitolo", () => {
  it("riconosce le guide al Platino dai titoli veri del sito, e non le guide a un trofeo singolo", async () => {
    const { guidaPlatinoDalTitolo } = await import("./hub");
    const a = (titolo: string, data = "2026-10-01") => ({ titolo, data });
    expect(guidaPlatinoDalTitolo([a("Hades II: guida al platino, consigli, durata e trofei da ottenere")])?.titolo).toContain("Hades II");
    expect(guidaPlatinoDalTitolo([a("Crimson Desert: la lista di tutti i trofei, durata e passaggi per il platino")])).not.toBeNull();
    expect(guidaPlatinoDalTitolo([a("Nioh 3: guida ai trofei, tutti i passaggi per ottenere il platino")])).not.toBeNull();
    expect(guidaPlatinoDalTitolo([a("Ghost of Tsushima: come ottenere il trofeo Buona caduta")])).toBeNull();
    expect(guidaPlatinoDalTitolo([a("guida al platino vecchia", "2025-01-01"), a("guida al platino nuova", "2026-01-01")])?.titolo).toBe("guida al platino nuova");
  });
});
