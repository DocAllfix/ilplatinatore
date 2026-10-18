import { describe, expect, it } from "vitest";
import { descrizioneHub, giocoDaMeta, perAiuto, tipoAiuto } from "./hub";

describe("tipoAiuto", () => {
  // i titoli veri delle 26 guide di Valor Mortis, con il tipo atteso
  const casi: Array<[string, string]> = [
    ["Valor Mortis: come ottenere Ambersmith e trovare tutte le 28 Ambre", "Collezionabili"],
    ["Valor Mortis: tutti i collezionabili del Capitolo 3, guida alle posizioni", "Collezionabili"],
    ["Valor Mortis: come sconfiggere il Generale Lothaire e ottenere Torn-Banner", "Boss"],
    ["Valor Mortis: The Emissary, come completare la missione e trovare Perfect Copy", "Missioni"],
    ["Valor Mortis: cosa fare dopo il finale, esplorazione libera e trofei mancanti", "Platino e trofei"],
    ["Valor Mortis: come eseguire parate, contrattacchi e gestire la resistenza", "Meccaniche e consigli"],
    ["Valor Mortis: come completare An Unheard Farewell e ottenere Aggressive Reconnaissance", "Missioni"],
    ["Valor Mortis: dove trovare tutti i materiali di potenziamento massimo", "Armi e potenziamenti"],
    ["Valor Mortis: tutti i 17 disegni di Caccia al Mostro e il trofeo Il Bestiario", "Collezionabili"],
    ["Valor Mortis: come ottenere la Cave Grotto Key e aprire la porta della grotta", "Meccaniche e consigli"],
    ["Valor Mortis: dove trovare i 7 Guardiani eterni e completare I Giurati", "Missioni"],
    ["Valor Mortis: tutte le 20 missioni secondarie, dove trovarle e come completarle", "Missioni"],
    ["Valor Mortis: migliori abilità iniziali e quali potenziamenti sbloccare per primi", "Armi e potenziamenti"],
    ["Valor Mortis: come aumentare le cure e potenziare le Fiale di Ferrofluido", "Armi e potenziamenti"],
    ["Valor Mortis: come sbloccare il viaggio rapido e usare le Lanterne", "Meccaniche e consigli"],
    ["Valor Mortis: tutti i boss in ordine e come sconfiggerli", "Boss"],
    ["Valor Mortis: tutte le armi e Transmutations, dove trovarle e come potenziarle", "Armi e potenziamenti"],
    ["Valor Mortis: come ottenere Sfratto Abissale e non perdere il trofeo mancabile", "Platino e trofei"],
    ["Valor Mortis: tutte le 28 Amber, dove trovarle e come ottenere Ambersmith", "Collezionabili"],
    ["Valor Mortis: guida al Platino, tutti i 39 trofei e roadmap completa", "Platino e trofei"],
  ];
  it.each(casi)("%s", (titolo, atteso) => expect(tipoAiuto(titolo)).toBe(atteso));
});

describe("giocoDaMeta", () => {
  it("niente hub se il tag non e' un gioco", () => {
    expect(giocoDaMeta(undefined)).toBeNull();
    expect(giocoDaMeta({ pl_gioco: "", pl_presentazione: "x" })).toBeNull();
  });
  it("legge piattaforme, uscita e slug (anche da indirizzi interi)", () => {
    const g = giocoDaMeta({
      pl_gioco: "1",
      pl_piattaforme: "PS5, Xbox Series X|S , PC",
      pl_uscita: "13/10/2026",
      pl_guida_platino: "https://www.ilplatinatore.it/2026/10/13/guida-platino/",
      pl_inizia_qui: "uno\n\n due \n",
    })!;
    expect(g.piattaforme).toEqual(["PS5", "Xbox Series X|S", "PC"]);
    expect(g.uscita).toBeUndefined();
    expect(g.guidaPlatino).toBe("guida-platino");
    expect(g.iniziaQui).toEqual(["uno", "due"]);
  });
});

describe("perAiuto e descrizione", () => {
  it("gruppi nell'ordine fisso, senza quelli vuoti", () => {
    const g = perAiuto([{ titolo: "tutti i boss" }, { titolo: "guida al Platino" }, { titolo: "viaggio rapido" }]);
    expect(g.map((x) => x.aiuto)).toEqual(["Platino e trofei", "Boss", "Meccaniche e consigli"]);
  });
  it("descrizione sotto i 160 caratteri, tagliata su una parola", () => {
    const d = descrizioneHub({ presentazione: "parola ".repeat(40), piattaforme: [], iniziaQui: [] }, "X");
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
