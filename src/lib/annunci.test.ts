import { describe, expect, it } from "vitest";
import { dividiCorpo } from "./guida/checklist";
import { inserisciAnnunci, NEL_TESTO } from "./annunci";

describe("inserisciAnnunci", () => {
  const p = (n: number) => Array.from({ length: n }, (_, i) => `<p>p${i + 1}</p>`).join("<h2>t</h2>");

  it("dopo il 1°, 3°, 4°, 5° e 7° paragrafo, come Advanced Ads oggi", () => {
    const out = inserisciAnnunci(p(8));
    expect(out).toContain("<p>p1</p><!--annuncio:304795-->");
    expect(out).toContain("<p>p3</p><!--annuncio:304796-->");
    expect(out).toContain("<p>p4</p><!--annuncio:304968-->");
    expect(out).toContain("<p>p5</p><!--annuncio:345270-->");
    expect(out).toContain("<p>p7</p><!--annuncio:304970-->");
    expect(out.match(/annuncio:/g)).toHaveLength(NEL_TESTO.length);
  });
  it("con pochi paragrafi gli annunci in piu' saltano", () => {
    const out = inserisciAnnunci(p(3));
    expect(out.match(/annuncio:/g)).toHaveLength(2);
  });
  it("il corpo si divide in pezzi di testo e annunci", () => {
    const pezzi = dividiCorpo(inserisciAnnunci(p(2)));
    expect(pezzi.filter((x) => "annuncio" in x)).toEqual([{ annuncio: "304795" }]);
  });
});
