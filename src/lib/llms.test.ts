import { describe, expect, it } from "vitest";
import { proteggi, testoLlms } from "./llms";

const BOM = String.fromCharCode(0xfeff);

describe("llms.txt", () => {
  it("protegge i caratteri del Markdown come Yoast", () => {
    expect(proteggi("PS5: come installare un SSD M.2")).toBe("PS5: come installare un SSD M\\.2");
    expect(proteggi("Torn-Banner")).toBe("Torn\\-Banner");
    expect(proteggi("dell'Emissario")).toBe("dell'Emissario");
  });

  it("ha le sezioni di Yoast nell'ordine di oggi", () => {
    const t = testoLlms("https://www.ilplatinatore.it", {
      pagine: [{ titolo: "Privacy Policy", percorso: "/privacy-policy/" }],
      articoli: [{ titolo: "A.b", percorso: "/2026/10/15/a/", descrizione: "Una descrizione." }],
      categorie: [{ titolo: "Guide", percorso: "/category/guide/" }],
      tag: [],
    });
    expect(t.startsWith(BOM + "# 🎮 Il Platinatore\n")).toBe(true);
    expect(t).toContain("## Pagine\n- [Privacy Policy](https://www.ilplatinatore.it/privacy-policy/)\n");
    expect(t).toContain("- [A\\.b](https://www.ilplatinatore.it/2026/10/15/a/): Una descrizione\\.");
    expect(t).not.toContain("## Tag");
    expect(t.endsWith("- [Sitemap index](https://www.ilplatinatore.it/sitemap_index.xml)\n")).toBe(true);
  });
});
