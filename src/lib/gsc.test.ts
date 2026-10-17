import { describe, expect, it } from "vitest";
import { periodo, slugDaRighe } from "./gsc";

describe("Search Console", () => {
  it("28 giorni che finiscono l'altro ieri", () => {
    expect(periodo(new Date("2026-10-17T10:00:00Z"))).toEqual({ inizio: "2026-09-18", fine: "2026-10-15" });
  });
  it("solo gli indirizzi degli articoli, per clic, senza doppioni", () => {
    const righe = [
      { keys: ["https://www.ilplatinatore.it/tag/valor-mortis/"], clicks: 90 },
      { keys: ["https://www.ilplatinatore.it/2026/10/13/guida-a/"], clicks: 10 },
      { keys: ["https://www.ilplatinatore.it/2026/10/14/guida-b/"], clicks: 50 },
      { keys: ["https://www.ilplatinatore.it/2026/10/14/guida-b/?amp"], clicks: 5 },
      { keys: ["non-un-indirizzo"], clicks: 99 },
    ];
    expect(slugDaRighe(righe)).toEqual(["guida-b", "guida-a"]);
  });
});
