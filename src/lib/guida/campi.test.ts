import { describe, expect, it } from "vitest";
import { collocaGruppi, schedaDaCampi, trofeiDaCampi } from "./campi";

const META = {
  pl_difficolta: 5,
  pl_ore_platino: "15–25 ore",
  pl_partite: "1",
  pl_mancabili: "1, Sfratto Abissale",
  pl_online: "0",
  pl_trofei_totali: 39,
  pl_nota_stime: "",
  pl_altri_dati: "Salvataggi manuali: No\nriga senza due punti\nNuova partita+: Non disponibile al lancio",
  pl_trofei: [
    { gruppo: "Boss e storia", nome: "Torn Banner", come: "Sconfiggere Lothaire" },
    { gruppo: "Boss e storia", nome: "Not a Cat Person", come: "" },
    { gruppo: "Missioni", nome: "A Bitter Cure", come: "Laudanum" },
    { gruppo: "Missioni", nome: "", come: "riga senza nome: scartata" },
  ],
};

describe("scheda dai campi strutturati", () => {
  it("legge i campi come la tabella, con trattini normali", () => {
    const s = schedaDaCampi(META)!;
    expect(s.difficolta).toEqual({ voto: 5, massimo: 10 });
    expect(s.tempo).toBe("15-25 ore");
    expect(s.mancabili).toEqual({ numero: 1, nomi: "Sfratto Abissale" });
    expect(s.trofei?.totale).toBe(39);
    expect(s.altre.map((v) => v.etichetta)).toEqual(["Salvataggi manuali", "Nuova partita+"]);
  });
  it("campi vuoti (articolo senza scheda): null, si ripiega sulla tabella", () => {
    expect(schedaDaCampi({ pl_difficolta: 0, pl_ore_platino: "", pl_trofei: [] })).toBeNull();
    expect(schedaDaCampi(undefined)).toBeNull();
  });
});

describe("trofei dai campi strutturati", () => {
  const g = trofeiDaCampi(META);
  it("raggruppa per gruppo nell'ordine della redazione e scarta le righe senza nome", () => {
    expect(g.map((x) => [x.titolo, x.voci.length])).toEqual([
      ["Boss e storia", 2],
      ["Missioni", 1],
    ]);
  });
  it("colloca i gruppi al posto delle tabelle, quelli in piu' dopo l'ultima", () => {
    const m = collocaGruppi(["t1"], g);
    expect(m.get("t1")!.map((x) => x.titolo)).toEqual(["Boss e storia", "Missioni"]);
  });
});
