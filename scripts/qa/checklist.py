"""Criteri del PDF (sezione 10) sulla checklist, provati in un browser vero da telefono:
  - la spunta aggiorna il contatore del gruppo e della barra;
  - le spunte restano dopo aver ricaricato la pagina;
  - «Da completare» nasconde le righe fatte;
  - Azzera chiede conferma e poi toglie le spunte.
Uso: python -I scripts/qa/checklist.py <indirizzo della guida> [variante a|b|c]
Esce con 1 se un criterio fallisce. Salva schermate in scripts/qa/out/checklist/.
"""
import os
import sys

from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "checklist")


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    url, var = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "a")
    os.makedirs(OUT, exist_ok=True)
    errori = []
    print(f"Checklist contro {url} (variante {var})")
    with sync_playwright() as p:
        b = p.chromium.launch(channel=os.environ.get("QA_CHANNEL", "chrome"))
        try:
            ctx = b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, color_scheme="dark")
            pg = ctx.new_page()
            pg.goto(f"{url}?v={var}", wait_until="load", timeout=90_000)
            pg.wait_for_timeout(1000)
            gruppo = pg.locator('section[aria-label^="Trofei"]').first
            contatore = lambda: gruppo.locator('p[aria-live]').first.inner_text().strip()  # noqa: E731
            # il contatore della barra della variante visibile
            barra = lambda: [x for x in pg.locator('[data-contatore-barra]').all() if x.evaluate("e => e.checkVisibility()")][0].inner_text().strip()  # noqa: E731
            pg.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
            pg.wait_for_timeout(600)
            pg.evaluate("window.scrollBy(0, -200)")  # la variante «al bisogno» compare risalendo
            pg.wait_for_timeout(600)
            prima, barra_prima = contatore(), barra()

            riga = gruppo.locator("[data-trofeo]").first
            nome = riga.get_attribute("data-trofeo")
            riga.scroll_into_view_if_needed()
            riga.locator("input").click()
            pg.wait_for_timeout(400)
            dopo, barra_dopo = contatore(), barra()
            print(f"  contatore gruppo: {prima!r} -> {dopo!r}; barra: {barra_prima!r} -> {barra_dopo!r}")
            if dopo == prima or barra_dopo == barra_prima:
                errori.append("la spunta non aggiorna i contatori")
            pg.screenshot(path=os.path.join(OUT, f"spuntato-{var}.png"))

            pg.reload(wait_until="load")
            pg.wait_for_timeout(1000)
            fatto = pg.locator(f'[data-trofeo="{nome}"]').first.get_attribute("data-fatto")
            print(f"  dopo il ricaricamento, {nome} fatto = {fatto}")
            if fatto != "true":
                errori.append("la spunta non resta dopo il ricaricamento")

            pg.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
            pg.wait_for_timeout(600)
            pg.evaluate("window.scrollBy(0, -200)")
            pg.wait_for_timeout(600)
            if var == "b":
                pg.get_by_role("button", name="Apri i comandi").click()
            filtro = [x for x in pg.get_by_role("button", name="Da completare").all() if x.is_visible()][0]
            filtro.click()
            pg.wait_for_timeout(300)
            if pg.locator(f'[data-trofeo="{nome}"]').count():
                errori.append("«Da completare» non nasconde le righe fatte")
            filtro.click()

            pg.get_by_text("Azzera le spunte di questa guida").click()
            pg.get_by_role("button", name="Azzera", exact=True).click()
            pg.wait_for_timeout(300)
            fatto = pg.locator(f'[data-trofeo="{nome}"]').first.get_attribute("data-fatto")
            if fatto != "false":
                errori.append("Azzera non toglie le spunte")
            ctx.close()
        finally:
            b.close()
    print("ok" if not errori else "ROSSO: " + "; ".join(errori))
    return 1 if errori else 0


if __name__ == "__main__":
    sys.exit(main())
