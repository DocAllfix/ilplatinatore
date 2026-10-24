"""Copia su Cloudflare i record DNS di oggi di ilplatinatore.it (letti dal DNS pubblico) e li confronta.

Tutti in «solo DNS» (nuvola grigia): il proxy di Cloudflare romperebbe posta e FTP, e il sito va
su Vercel senza proxy. TTL di sito e www a 300 s, per un passaggio e un ritorno veloci.

  python -I scripts/dns/copia-zona.py            prova: dice che cosa creerebbe
  python -I scripts/dns/copia-zona.py --applica  crea i record mancanti su Cloudflare
  python -I scripts/dns/copia-zona.py --confronta confronta Cloudflare con il DNS pubblico di oggi
Esce con 1 se qualcosa non torna. Segreti da .env.segreti (mai stampati).
"""
import json, sys, urllib.request
from pathlib import Path

RADICE = Path(__file__).resolve().parents[2]
D = "ilplatinatore.it"
NOMI = ["", "www", "mail", "mx", "smtp", "pop", "pop3", "imap", "webmail", "autodiscover", "autoconfig", "ftp", "cms",
        "_dmarc", "default._domainkey", "aruba._domainkey", "dkim._domainkey", "_autodiscover._tcp", "admin",
        "_domainconnect", "pec", "posta", "smtps", "imaps", "pop3s",
        # dall'esportazione della zona di Aruba (22/10/2026): nomi che dall'esterno non si indovinano
        "a1._domainkey", "stat", "statistiche", "sms", "_xmpp-client._tcp", "_xmpp-server._tcp"]
TIPI = {1: "A", 28: "AAAA", 5: "CNAME", 15: "MX", 16: "TXT", 257: "CAA", 33: "SRV"}
VELOCI = {D, f"www.{D}"}

env = {}
for r in (RADICE / ".env.segreti").read_text(encoding="utf-8").splitlines():
    if "=" in r and not r.startswith("#"):
        k, v = r.split("=", 1); env[k.strip()] = v.strip()
CF = "https://api.cloudflare.com/client/v4"
H = {"Authorization": f"Bearer {env['CLOUDFLARE_API_TOKEN']}", "Content-Type": "application/json"}

def cf(metodo, percorso, corpo=None):
    req = urllib.request.Request(CF + percorso, method=metodo, headers=H, data=json.dumps(corpo).encode() if corpo else None)
    try:
        with urllib.request.urlopen(req, timeout=30) as r: return json.load(r)
    except urllib.error.HTTPError as e: return json.load(e)

def pubblici():
    out = []
    for n in NOMI:
        fq = f"{n}.{D}" if n else D
        for t in TIPI.values():
            r = json.load(urllib.request.urlopen(f"https://dns.google/resolve?name={fq}&type={t}", timeout=20))
            for a in r.get("Answer", []):
                if a["name"].rstrip(".") == fq and TIPI.get(a["type"]) == t:
                    out.append((fq, t, a["data"].rstrip("."), a["TTL"]))
    return out

def norm_txt(s): return s.strip('"')

def chiave(nome, tipo, dato):
    if tipo == "TXT": dato = norm_txt(dato)
    return (nome, tipo, dato.rstrip(".").lower())

def main():
    zona = cf("GET", f"/zones?name={D}")["result"][0]["id"]
    oggi = pubblici()
    esistenti = cf("GET", f"/zones/{zona}/dns_records?per_page=500")["result"]
    def dato_cf(r):
        if r["type"] == "MX": return f"{r['priority']} {r['content']}"
        # come l'MX, Cloudflare tiene la priorita' dell'SRV in un campo a parte
        if r["type"] == "SRV": return f"{r['priority']} {r['content']}".replace("\t", " ")
        return r["content"]
    su_cf = {chiave(r["name"], r["type"], dato_cf(r)) for r in esistenti}
    attesi = {chiave(n, t, d) for n, t, d, _ in oggi}
    if "--confronta" in sys.argv:
        # nomi aggiunti apposta su Cloudflare, che il sito su Aruba non aveva: si elencano, non sono differenze
        voluti = {"img.ilplatinatore.it", "visite.ilplatinatore.it"}  # visite: contatore Umami (infra/umami/), dal 24/10/2026  # Worker delle immagini su R2 (infra/cloudflare/), dal 22/10/2026
        manca = attesi - su_cf; in_piu = {x for x in su_cf - attesi if x[0] not in voluti}
        for r in esistenti:
            if r["name"] in voluti: print("  voluto:", r["name"], r["type"], "proxy" if r.get("proxied") else "")
        print(f"record di oggi: {len(attesi)}, su Cloudflare: {len(su_cf)}")
        for x in sorted(manca): print("  manca su Cloudflare:", x)
        for x in sorted(in_piu): print("  in piu' su Cloudflare:", x)
        proxati = [r["name"] for r in esistenti if r.get("proxied") and r["name"] not in voluti]
        if proxati: print("  ATTENZIONE dietro il proxy:", proxati)
        print("identici" if not manca and not in_piu and not proxati else "DIFFERENZE")
        return 1 if (manca or in_piu or proxati) else 0
    da_creare = [x for x in oggi if chiave(x[0], x[1], x[2]) not in su_cf]
    print(f"record di oggi: {len(oggi)}, da creare: {len(da_creare)}")
    for n, t, d, ttl in da_creare:
        corpo = {"type": t, "name": n, "ttl": 300 if n in VELOCI and t in ("A", "AAAA") else ttl, "proxied": False}
        if t == "MX":
            pr, ct = d.split(" ", 1); corpo.update(priority=int(pr), content=ct.rstrip("."))
        elif t == "SRV":
            pr, peso, porta, dest = d.split(" ")
            corpo["data"] = {"priority": int(pr), "weight": int(peso), "port": int(porta), "target": dest.rstrip(".")}
        elif t == "TXT":
            corpo["content"] = d if d.startswith('"') else f'"{d}"'
        else:
            corpo["content"] = d
        if t != "SRV": corpo.pop("data", None)
        if "--applica" in sys.argv:
            r = cf("POST", f"/zones/{zona}/dns_records", corpo)
            print(("  creato " if r["success"] else "  ERRORE ") + f"{t:5} {n} {d}" + ("" if r["success"] else f" {r['errors']}"))
        else:
            print(f"  {t:5} {n} {d} ttl={corpo['ttl']}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
