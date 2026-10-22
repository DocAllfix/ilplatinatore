"""Pubblica il Worker delle immagini (immagini-worker.js) e lo collega a img.ilplatinatore.it.

Uso: python -X utf8 -I infra/cloudflare/pubblica-worker.py [--dominio]
Token e account in .env.segreti (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID), mai stampati.
Senza --dominio aggiorna solo il codice; con --dominio crea anche il dominio personalizzato
(Cloudflare aggiunge da solo il record DNS di img, nessun altro record della zona cambia).
"""

import json
import pathlib
import sys
import urllib.error
import urllib.request
import uuid

RADICE = pathlib.Path(__file__).resolve().parents[2]
NOME = "platinatore-immagini"
DOMINIO = "img.ilplatinatore.it"
ZONA = "6b6893e3981a3bc513abf6bbc798e7dd"
CMS = "https://cms.ilplatinatore.it"

env = {}
for r in (RADICE / ".env.segreti").read_text(encoding="utf-8").splitlines():
    if "=" in r and not r.startswith("#"):
        k, v = r.split("=", 1)
        env[k.strip()] = v.strip()
TOKEN, ACCOUNT = env["CLOUDFLARE_API_TOKEN"], env["CLOUDFLARE_ACCOUNT_ID"]


def api(metodo, percorso, corpo=None, tipo="application/json"):
    req = urllib.request.Request(
        f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}{percorso}",
        data=corpo, method=metodo, headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": tipo},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"API {metodo} {percorso}: {e.code} {e.read().decode()[:400]}")


def pubblica_codice():
    codice = (RADICE / "infra/cloudflare/immagini-worker.js").read_bytes()
    meta = {
        "main_module": "worker.js",
        "compatibility_date": "2026-10-01",
        "bindings": [
            {"type": "r2_bucket", "name": "BUCKET", "bucket_name": "platinatore-media"},
            {"type": "plain_text", "name": "CMS", "text": CMS},
        ],
    }
    confine = uuid.uuid4().hex
    parti = [
        f'--{confine}\r\nContent-Disposition: form-data; name="metadata"\r\nContent-Type: application/json\r\n\r\n'.encode()
        + json.dumps(meta).encode() + b"\r\n",
        f'--{confine}\r\nContent-Disposition: form-data; name="worker.js"; filename="worker.js"\r\n'
        "Content-Type: application/javascript+module\r\n\r\n".encode() + codice + b"\r\n",
        f"--{confine}--\r\n".encode(),
    ]
    r = api("PUT", f"/workers/scripts/{NOME}", b"".join(parti), f"multipart/form-data; boundary={confine}")
    print("codice pubblicato:", r["success"])


def collega_dominio():
    corpo = {"hostname": DOMINIO, "service": NOME, "zone_id": ZONA, "environment": "production"}
    r = api("PUT", "/workers/domains", json.dumps(corpo).encode())
    print("dominio:", r["result"]["hostname"], r["success"])


pubblica_codice()
if "--dominio" in sys.argv:
    collega_dominio()
