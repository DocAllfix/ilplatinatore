import { describe, expect, it } from "vitest";
import { giochiDelMomento, paroleDa, perModifica, senzaRipetizioni, titoloContiene } from "./home";

describe("home a sezioni", () => {
  it("giochi del momento: solo i tag che sono giochi, per numero di articoli", () => {
    const giochi = new Set([1, 2, 3]);
    expect(giochiDelMomento([[1, 9], [2], [2, 9], [3, 2], [9]], giochi, 2)).toEqual([2, 1]);
  });
  it("parole intere nel titolo, senza accenti", () => {
    const p = paroleDa("enigma, soluzione , Più letti");
    expect(titoloContiene("Soluzione dell'enigma degli elettrodomestici", p)).toBe(true);
    expect(titoloContiene("Gli enigmisti", paroleDa("enigma"))).toBe(false);
    expect(titoloContiene("I più letti", p)).toBe(true);
  });
  it("liste unite, senza doppioni, dall'ultima modifica", () => {
    const a = { id: 1, titolo: "a", data: "2026-01-01", modificato: "2026-10-10" };
    const b = { id: 2, titolo: "b", data: "2026-10-12" };
    const c = { id: 3, titolo: "c", data: "2026-01-01", modificato: "2026-10-11" };
    expect(perModifica([[a, b], [a, c]], 10).map((x) => x.id)).toEqual([2, 3, 1]);
  });
});

describe("senzaRipetizioni", () => {
  it("toglie i doppioni dalle file sotto, ma non svuota una fila", () => {
    const x = (...ids: number[]) => ids.map((id) => ({ id }));
    const r = senzaRipetizioni([x(1, 2, 3, 4), x(1, 2, 5, 6, 7, 8), x(1, 2)], 4);
    expect(r.map((l) => l.map((a) => a.id))).toEqual([[1, 2, 3, 4], [5, 6, 7, 8], [1, 2]]);
  });
});
