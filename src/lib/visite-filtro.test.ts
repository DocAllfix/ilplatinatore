import { describe, expect, it } from "vitest";
import { eUnProgramma, type Ambiente } from "./visite-filtro";

const WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";
// iPadOS si presenta come un Mac, con il tocco
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15";

const a = (userAgent: string, larghezza: number, altezza: number, toccoMax = 0, webdriver = false): Ambiente => ({
  userAgent,
  larghezza,
  altezza,
  toccoMax,
  webdriver,
});

describe("le persone si contano", () => {
  it("telefoni, tablet e computer veri (impronte delle sessioni italiane)", () => {
    expect(eUnProgramma(a(ANDROID, 384, 832, 5))).toBe(false);
    expect(eUnProgramma(a(IPHONE, 393, 852, 5))).toBe(false);
    expect(eUnProgramma(a(IPHONE, 375, 812, 5))).toBe(false); // iPhone mini: 375x812 e' vero su iOS
    expect(eUnProgramma(a(IPAD, 820, 1180, 5))).toBe(false);
    expect(eUnProgramma(a(WINDOWS, 1920, 1080))).toBe(false);
    expect(eUnProgramma(a(WINDOWS, 1366, 768, 10))).toBe(false); // portatile col touch
  });
});

describe("i programmi no", () => {
  it("browser guidato da un programma", () => {
    expect(eUnProgramma(a(WINDOWS, 1920, 1080, 0, true))).toBe(true);
  });
  it("schermi che non esistono: l'impronta di Singapore e Cina, la finestra dei browser automatici", () => {
    expect(eUnProgramma(a(WINDOWS, 1280, 1200))).toBe(true);
    expect(eUnProgramma(a(WINDOWS, 1600, 1600))).toBe(true);
    expect(eUnProgramma(a(WINDOWS, 800, 600))).toBe(true);
  });
  it("telefoni simulati su un computer", () => {
    expect(eUnProgramma(a(ANDROID, 412, 915, 0))).toBe(true); // senza tocco
    expect(eUnProgramma(a(IPHONE, 1920, 1080, 5))).toBe(true); // schermo da televisore
    expect(eUnProgramma(a(ANDROID, 375, 812, 5))).toBe(true); // Android con lo schermo di un iPhone
  });
});
