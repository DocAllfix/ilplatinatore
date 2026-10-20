import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { argomentiHub, descrizioneDaSezioni, eHub, leggiRegistro, perSezione, sezioneDi, titoloHub } from "./registro-hub";

// il registro approvato dal proprietario, lo stesso testo che sta nel CMS
const R = leggiRegistro(readFileSync("infra/cms/registro-hub.txt", "utf8"));

describe("lettura del registro", () => {
  it("sezioni nell'ordine, generico ed esclusi", () => {
    expect(R.sezioni.map((s) => s.nome)).toEqual([
      "Collezionabili", "Sfide ed eventi", "Enigmi e puzzle", "Boss", "Missioni e storia", "Trofei", "Build, armi e abilità", "Novità e uscite",
    ]);
    expect(R.generico).toBe("Come fare e consigli");
    expect(R.esclusi).toEqual(["novita", "playstation-5", "xbox", "nintendo-switch", "warhammer-40000"]);
  });
  it("note e righe vuote non contano; registro vuoto: tutto nel generico", () => {
    const r = leggiRegistro("# nota\n\nBoss: boss\n");
    expect(r.sezioni).toEqual([{ nome: "Boss", parole: ["boss"] }]);
    expect(sezioneDi("qualunque cosa", "", leggiRegistro(""))).toBe("Come fare e consigli");
  });
});

describe("i titoli veri degli esempi del proprietario", () => {
  const casi: Array<[string, string, string]> = [
    ["Valor Mortis: tutti i collezionabili del Capitolo 3, guida alle posizioni", "Valor Mortis", "Collezionabili"],
    ["Valor Mortis: come battere l’Orfano, due fasi e attacchi imparabili", "Valor Mortis", "Boss"],
    ["Valor Mortis: guida al Platino, tutti i 39 trofei e roadmap completa", "Valor Mortis", "Trofei"],
    ["Valor Mortis: The Emissary, come completare la missione e trovare Perfect Copy", "Valor Mortis", "Missioni e storia"],
    ["FC 27 Xavi Espart Future Stars SBC: soluzione, costo e conviene?", "EA Sports FC 27", "Sfide ed eventi"],
    ["FC 27 Claire Hutton Future Stars: come completare tutti gli obiettivi", "EA Sports FC 27", "Sfide ed eventi"],
    ["EA Sports FC 27 The Grounds: migliore build DC con Leader", "EA Sports FC 27", "Build, armi e abilità"],
    ["Come fare lo sprint boost su EA Sports FC 26?", "EA Sports FC 26", "Come fare e consigli"],
    ["Horizon Forbidden West: tutti i Collilunghi e come completarli", "Horizon Forbidden West", "Collezionabili"],
    ["Horizon Forbidden West: come ottenere il Platino e tutti i trofei", "Horizon Forbidden West", "Trofei"],
    ["Come ottenere il trofeo I Would Drive 500 Miles in Bus Bound: la guida completa alla distanza", "Bus Bound", "Trofei"],
  ];
  it.each(casi)("%s", (titolo, gioco, atteso) => expect(sezioneDi(titolo, gioco, R)).toBe(atteso));
  it("le parole intere non scattano dentro altre parole («armi» non e' «armadio»; «boss» non e' «bossolo»)", () => {
    expect(sezioneDi("come aprire l'armadio", "", R)).toBe("Come fare e consigli");
    expect(sezioneDi("raccogliere un bossolo", "", R)).toBe("Come fare e consigli");
  });
});

describe("hub", () => {
  it("sezioni dalla piu' piena, generico in fondo, vuote assenti", () => {
    const g = perSezione(
      [{ titolo: "come iniziare" }, { titolo: "tutti i boss" }, { titolo: "boss finale" }, { titolo: "tutti i collezionabili" }, { titolo: "consigli" }, { titolo: "altri consigli" }, { titolo: "trucchi" }],
      "",
      R,
    );
    expect(g.map((x) => [x.aiuto, x.guide.length])).toEqual([["Boss", 2], ["Collezionabili", 1], ["Come fare e consigli", 4]]);
  });
  it("gli esclusi non sono hub", () => {
    expect(eHub("novita", R)).toBe(false);
    expect(eHub("valor-mortis", R)).toBe(true);
  });
  it("titolo e descrizione dalle sezioni che ci sono", () => {
    expect(titoloHub("Valor Mortis", argomentiHub(["Collezionabili", "Boss", "Trofei", "Come fare e consigli"], true, R))).toBe("Valor Mortis: guide, Platino e collezionabili");
    expect(titoloHub("EA Sports FC 27", argomentiHub(["Come fare e consigli", "Sfide ed eventi", "Build, armi e abilità"], false, R))).toBe("EA Sports FC 27: guide, sfide e build");
    expect(titoloHub("X", argomentiHub(["Come fare e consigli"], false, R))).toBe("X: guide e consigli");
    const d = descrizioneDaSezioni("EA Sports FC 27", argomentiHub(["Sfide ed eventi", "Build, armi e abilità", "Novità e uscite"], false, R));
    expect(d).toBe("Tutte le guide di EA Sports FC 27 sul Platinatore: sfide, build e novità, con i consigli per giocare.");
  });
});
