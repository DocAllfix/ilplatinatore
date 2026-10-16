"""Schermate da telefono (390 px) in tema scuro e chiaro, per guardare le varianti come il lettore.

Uso: python -I scripts/qa/schermate.py <indirizzo> [<indirizzo> ...]
Le schermate vanno in scripts/qa/out/schermate/, una per tema, alta quanto la pagina fino a 2.400 px.
"""
import os
import re
import sys

from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "schermate")


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel=os.environ.get("QA_CHANNEL", "chrome"))
        try:
            for tema in ("dark", "light"):
                ctx = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True,
                                          color_scheme=tema, locale="it-IT")
                pagina = ctx.new_page()
                for url in sys.argv[1:]:
                    pagina.goto(url, wait_until="load", timeout=90_000)
                    pagina.wait_for_timeout(800)
                    nome = re.sub(r"[^a-z0-9]+", "_", url.split("//", 1)[-1].lower()).strip("_")[-70:]
                    file = os.path.join(OUT, f"{nome}-{tema}.png")
                    pagina.screenshot(path=file, clip={"x": 0, "y": 0, "width": 390, "height": 2400}, full_page=True)
                    print(file)
                ctx.close()
        finally:
            browser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
