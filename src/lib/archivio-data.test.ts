import { describe, expect, it } from "vitest";
import { esitoData, periodo } from "./archivio-data";

describe("esitoData", () => {
  it("riscrive anno, mese, giorno e pagine verso la pagina interna", () => {
    expect(esitoData("/2026/")).toEqual({ tipo: "riscrivi", interno: "/archivio-data/2026/0/0/1/" });
    expect(esitoData("/2026/10/")).toEqual({ tipo: "riscrivi", interno: "/archivio-data/2026/10/0/1/" });
    expect(esitoData("/2026/10/15/")).toEqual({ tipo: "riscrivi", interno: "/archivio-data/2026/10/15/1/" });
    expect(esitoData("/2026/page/2/")).toEqual({ tipo: "riscrivi", interno: "/archivio-data/2026/0/0/2/" });
    expect(esitoData("/2026/10/page/33/")).toEqual({ tipo: "riscrivi", interno: "/archivio-data/2026/10/0/33/" });
    expect(esitoData("/2026/1/")).toEqual({ tipo: "riscrivi", interno: "/archivio-data/2026/1/0/1/" });
  });

  it("rimanda come WordPress: mese 13 all'anno, giorno 32 al mese, /page/1/ alla prima", () => {
    expect(esitoData("/2026/13/")).toEqual({ tipo: "rimanda", a: "/2026/" });
    expect(esitoData("/2026/10/32/")).toEqual({ tipo: "rimanda", a: "/2026/10/" });
    expect(esitoData("/2026/02/30/")).toEqual({ tipo: "rimanda", a: "/2026/02/" });
    expect(esitoData("/2026/10/page/1/")).toEqual({ tipo: "rimanda", a: "/2026/10/" });
  });

  it("lascia stare tutto il resto", () => {
    expect(esitoData("/2026/10/15/valor-mortis-guida/")).toBeNull();
    expect(esitoData("/privacy-policy/")).toBeNull();
    expect(esitoData("/2026")).toBeNull();
    expect(esitoData("/0999/")).toBeNull();
  });
});

describe("periodo", () => {
  it("titoli di Yoast e limiti esclusivi per la REST", () => {
    expect(periodo(2026, 0, 0)).toEqual({ titolo: "2026", base: "/2026/", dopo: "2025-12-31T23:59:59", prima: "2027-01-01T00:00:00" });
    expect(periodo(2026, 10, 0)).toEqual({ titolo: "Ottobre 2026", base: "/2026/10/", dopo: "2026-09-30T23:59:59", prima: "2026-11-01T00:00:00" });
    expect(periodo(2026, 10, 15)).toEqual({ titolo: "Ottobre 15, 2026", base: "/2026/10/15/", dopo: "2026-10-14T23:59:59", prima: "2026-10-16T00:00:00" });
    expect(periodo(2026, 1, 0)?.base).toBe("/2026/01/");
  });

  it("rifiuta i valori impossibili", () => {
    expect(periodo(2026, 13, 0)).toBeNull();
    expect(periodo(2026, 0, 5)).toBeNull();
  });
});
