"""Trasloco del CMS da CAX11 (ARM) a CX33 (Intel/AMD, 4 vCPU, 8 GB) a Norimberga, con lo STESSO IPv4.

L'IPv4 primario (49.13.164.162) si stacca dal vecchio server e si attacca al nuovo: cms.ilplatinatore.it,
Vercel e i monitor non cambiano niente. Il sito pubblico non si ferma: Vercel serve le pagine pronte.
Si lancia dalla macchina dell'amministratore (l'SSH e' aperto solo da li'), una fase alla volta:

  python -I infra/cms/sposta-server.py --stato      che cosa c'e' adesso (sola lettura)
  python -I infra/cms/sposta-server.py --prepara    crea il CX33 e ci copia tutto, il vecchio resta acceso
  python -I infra/cms/sposta-server.py --cambia     ultima copia, spegne il vecchio, sposta l'IP (CMS fermo ~10 min)
  python -I infra/cms/sposta-server.py --chiudi     istantanea del vecchio, poi lo cancella (dopo qualche giorno)

Token in .env.segreti (HETZNER_API_TOKEN), mai stampato. Il database si copia con un dump (non i file
grezzi: si passa da ARM a x86); immagini e certificati HTTPS con rsync fra i due server.
"""

import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

RADICE = Path(__file__).resolve().parents[2]
VECCHIO_NOME = "platinatore-cms"
NUOVO_NOME = "platinatore-cms-cx33"
TIPO, LUOGO, IMMAGINE = "cx33", "nbg1", "ubuntu-24.04"
IP_ID = 155919564  # IPv4 primario 49.13.164.162 (auto_delete spento, protetto dalla cancellazione)
IP = "49.13.164.162"
FIREWALL_ID = 11817006
CHIAVE = str(Path.home() / ".ssh" / "hetzner_platinatore")
CARTELLA = "/opt/platinatore-cms"
VOLUMI = ["platinatore-cms_wp-data", "platinatore-cms_caddy-data", "platinatore-cms_caddy-config"]

env = {}
for r in (RADICE / ".env.segreti").read_text(encoding="utf-8").splitlines():
    if "=" in r and not r.startswith("#"):
        k, v = r.split("=", 1)
        env[k.strip()] = v.strip()


def api(metodo, percorso, corpo=None):
    req = urllib.request.Request(
        "https://api.hetzner.cloud/v1" + percorso, method=metodo,
        headers={"Authorization": f"Bearer {env['HETZNER_API_TOKEN']}", "Content-Type": "application/json"},
        data=json.dumps(corpo).encode() if corpo is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            testo = r.read()
            return json.loads(testo) if testo else {}
    except urllib.error.HTTPError as e:
        raise SystemExit(f"API {metodo} {percorso}: {e.code} {e.read().decode()[:400]}")


def aspetta_azione(a):
    while a["status"] == "running":
        time.sleep(3)
        a = api("GET", f"/actions/{a['id']}")["action"]
    if a["status"] != "success":
        raise SystemExit(f"azione {a['command']} fallita: {a.get('error')}")


def server(nome):
    s = api("GET", f"/servers?name={nome}")["servers"]
    return s[0] if s else None


def ssh(ip, comando, entrata=None, controlla=True):
    r = subprocess.run(["ssh", "-i", CHIAVE, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=10",
                        f"root@{ip}", comando], input=entrata, capture_output=True, text=True)
    if controlla and r.returncode != 0:
        raise SystemExit(f"[{ip}] errore in: {comando[:120]}\n{r.stdout[-1500:]}\n{r.stderr[-1500:]}")
    return r.stdout


def aspetta_ssh(ip):
    for _ in range(60):
        if subprocess.run(["ssh", "-i", CHIAVE, "-o", "StrictHostKeyChecking=accept-new", "-o", "ConnectTimeout=5",
                           f"root@{ip}", "true"], capture_output=True).returncode == 0:
            return
        time.sleep(5)
    raise SystemExit(f"{ip}: SSH non risponde")


def ip_di(s):
    return s["public_net"]["ipv4"]["ip"] if s["public_net"].get("ipv4") else None


def regola_firewall(attiva):
    """22 aperto anche dall'IP del vecchio server, solo durante la copia fra i due."""
    f = api("GET", f"/firewalls/{FIREWALL_ID}")["firewall"]
    regole = [r for r in f["rules"] if r.get("description") != "trasloco"]
    if attiva:
        regole.append({"direction": "in", "protocol": "tcp", "port": "22", "source_ips": [f"{IP}/32"], "description": "trasloco"})
    for a in api("POST", f"/firewalls/{FIREWALL_ID}/actions/set_rules", {"rules": regole})["actions"]:
        aspetta_azione(a)


RS = "rsync -aHAX --numeric-ids --delete -e 'ssh -i /root/.ssh/trasloco -o StrictHostKeyChecking=accept-new' "


def accesso_fra_server(nuovo_ip):
    """Una chiave del vecchio, autorizzata solo sul nuovo: la copia passa dentro il datacenter."""
    ssh(IP, "test -f /root/.ssh/trasloco || ssh-keygen -q -t ed25519 -N '' -C trasloco -f /root/.ssh/trasloco")
    pub = ssh(IP, "cat /root/.ssh/trasloco.pub").strip()
    ssh(nuovo_ip, f"grep -qF '{pub}' /root/.ssh/authorized_keys || echo '{pub}' >> /root/.ssh/authorized_keys")


def copia_cartella(nuovo_ip):
    ssh(IP, RS + f"--exclude import/ {CARTELLA}/ root@{nuovo_ip}:{CARTELLA}/")


def copia_chiavi_backup(nuovo_ip):
    """La chiave della Storage Box e la passphrase dei backup: senza, i backup sul nuovo fallirebbero."""
    ssh(IP, RS.replace("--delete ", "") + f"/root/.ssh/id_ed25519 /root/.ssh/id_ed25519.pub /root/.ssh/known_hosts /root/.platinatore-backup-pass root@{nuovo_ip}:/root/.staging/")
    ssh(nuovo_ip, "install -m 600 /root/.staging/id_ed25519 /root/.ssh/id_ed25519 && install -m 644 /root/.staging/id_ed25519.pub /root/.ssh/id_ed25519.pub "
                  "&& cat /root/.staging/known_hosts >> /root/.ssh/known_hosts && install -m 600 /root/.staging/.platinatore-backup-pass /root/.platinatore-backup-pass && rm -rf /root/.staging")


def copia_volumi(nuovo_ip):
    """Immagini caricate, WordPress e certificati HTTPS. I volumi sul nuovo li crea prima Compose."""
    for v in VOLUMI:
        ssh(IP, RS + f"/var/lib/docker/volumes/{v}/_data/ root@{nuovo_ip}:/var/lib/docker/volumes/{v}/_data/")


def copia_database(nuovo_ip):
    """Dump dal vecchio, import nel nuovo (stesso nome, stesso utente: li crea il primo avvio di MariaDB)."""
    ssh(nuovo_ip, f"cd {CARTELLA} && docker compose up -d --wait db")
    ssh(IP, f"cd {CARTELLA} && R=$(grep ^DB_ROOT_PASSWORD= .env | cut -d= -f2-) && "
            "docker compose exec -T db mariadb-dump -uroot -p\"$R\" --single-transaction --routines --triggers --default-character-set=utf8mb4 wp_platinatore "
            f"| gzip | ssh -i /root/.ssh/trasloco root@{nuovo_ip} 'cd {CARTELLA} && R=$(grep ^DB_ROOT_PASSWORD= .env | cut -d= -f2-) && gunzip | docker compose exec -T db mariadb -uroot -p\"$R\" wp_platinatore'")
    conta = lambda ip: ssh(ip, f"cd {CARTELLA} && docker compose --profile strumenti run --rm -T cli wp post list --post_type=post --post_status=any --format=count 2>/dev/null").strip()
    vecchio, nuovo = conta(IP), conta(nuovo_ip)
    print(f"    articoli: vecchio {vecchio}, nuovo {nuovo}")
    if vecchio != nuovo:
        raise SystemExit("i conteggi non coincidono: fermo")


def prova_http(ip):
    """Il nuovo risponde come cms.ilplatinatore.it (certificato copiato) prima che l'IP si sposti."""
    for percorso, atteso in (("/wp-json/platinatore/v1/home", "sezioni"), ("/wp-json/platinatore/v1/registro-hub", "Esclusi")):
        r = subprocess.run(["curl", "-s", "--resolve", f"cms.ilplatinatore.it:443:{ip}", f"https://cms.ilplatinatore.it{percorso}"],
                           capture_output=True, text=True)
        print(f"    {percorso}: {'ok' if atteso in r.stdout else 'NO'}")
        if atteso not in r.stdout:
            raise SystemExit("il nuovo server non risponde come deve")


def stato():
    for nome in (VECCHIO_NOME, NUOVO_NOME):
        s = server(nome)
        print(f"{nome}: " + (f"{s['server_type']['name']} {s['location']['name']} {s['status']} ip {ip_di(s)}" if s else "non esiste"))
    t = api("GET", f"/server_types?name={TIPO}")["server_types"][0]
    print(f"{TIPO} disponibile in: {[l['name'] for l in t['locations'] if l['available']] or 'nessun luogo'}")
    ipp = api("GET", f"/primary_ips/{IP_ID}")["primary_ip"]
    print(f"IPv4 {IP}: assegnato a {ipp['assignee_id']}, auto_delete {ipp['auto_delete']}, protezione {ipp['protection']}")


def prepara():
    t = api("GET", f"/server_types?name={TIPO}")["server_types"][0]
    if not any(l["name"] == LUOGO and l["available"] for l in t["locations"]):
        raise SystemExit(f"{TIPO} non disponibile a {LUOGO}")
    nuovo = server(NUOVO_NOME)
    if not nuovo:
        print("[1] creo il CX33")
        chiavi = [k["id"] for k in api("GET", "/ssh_keys")["ssh_keys"] if k["name"] == "platinatore-cms"]
        r = api("POST", "/servers", {"name": NUOVO_NOME, "server_type": TIPO, "location": LUOGO, "image": IMMAGINE,
                                      "ssh_keys": chiavi, "firewalls": [{"firewall": FIREWALL_ID}],
                                      "public_net": {"enable_ipv4": True, "enable_ipv6": False}, "labels": {"progetto": "platinatore"}})
        aspetta_azione(r["action"])
        nuovo = server(NUOVO_NOME)
    nip = ip_di(nuovo)
    print(f"    nuovo: {nip}")
    aspetta_ssh(nip)
    print("[2] sistema, Docker, swap, aggiornamenti automatici")
    subprocess.run(["scp", "-i", CHIAVE, "-q", str(RADICE / "infra/cms/setup-vps.sh"), f"root@{nip}:/root/setup-vps.sh"], check=True)
    ssh(nip, "bash /root/setup-vps.sh >/root/setup-vps.log 2>&1 && mkdir -p " + CARTELLA)
    print("[3] copia dal vecchio, dentro il datacenter: cartella del CMS e chiavi dei backup")
    regola_firewall(True)
    accesso_fra_server(nip)
    copia_cartella(nip)
    copia_chiavi_backup(nip)
    print("[4] contenitori (creano i volumi), poi immagini, certificati e database")
    ssh(nip, f"cd {CARTELLA} && docker compose --profile strumenti pull -q && docker compose up --no-start")
    copia_volumi(nip)
    copia_database(nip)
    ssh(nip, f"cd {CARTELLA} && docker compose up -d --wait")
    print("[5] prova come cms.ilplatinatore.it sull'indirizzo provvisorio")
    prova_http(nip)
    print("Pronto. Il vecchio e' ancora quello vero. Il cambio: --cambia")


def cambia():
    vecchio, nuovo = server(VECCHIO_NOME), server(NUOVO_NOME)
    if not nuovo:
        raise SystemExit("prima --prepara")
    nip = ip_di(nuovo)
    print("[1] CMS fermo sul vecchio (niente scritture), cron sospesi")
    ssh(IP, f"crontab -l > /root/crontab.trasloco && crontab -r; cd {CARTELLA} && docker compose stop wp caddy")
    print("[2] ultima copia: file cambiati e database")
    copia_cartella(nip)
    copia_volumi(nip)
    copia_database(nip)
    print("[3] cron sul nuovo")
    cron = ssh(IP, "cat /root/crontab.trasloco")
    ssh(nip, "crontab -", entrata=cron)
    print("[4] spengo i due server e sposto l'IPv4")
    for s in (vecchio, nuovo):
        aspetta_azione(api("POST", f"/servers/{s['id']}/actions/shutdown")["action"])
        for _ in range(40):
            if server(s["name"])["status"] == "off":
                break
            time.sleep(3)
        else:
            aspetta_azione(api("POST", f"/servers/{s['id']}/actions/poweroff")["action"])
    provvisorio = nuovo["public_net"]["ipv4"]["id"]
    aspetta_azione(api("POST", f"/primary_ips/{IP_ID}/actions/unassign")["action"])
    aspetta_azione(api("POST", f"/primary_ips/{provvisorio}/actions/unassign")["action"])
    aspetta_azione(api("POST", f"/primary_ips/{IP_ID}/actions/assign", {"assignee_id": nuovo["id"], "assignee_type": "server"})["action"])
    aspetta_azione(api("POST", f"/servers/{nuovo['id']}/actions/poweron")["action"])
    api("DELETE", f"/primary_ips/{provvisorio}")
    subprocess.run(["ssh-keygen", "-R", IP], capture_output=True)
    subprocess.run(["ssh-keygen", "-R", "platinatore-cms"], capture_output=True)
    aspetta_ssh(IP)
    print("[5] il nuovo risponde sull'indirizzo vero")
    regola_firewall(False)
    prova_http(IP)
    print(ssh(IP, f"nproc; free -m | sed -n 2p; cd {CARTELLA} && docker compose ps --format '{{{{.Name}}}} {{{{.Status}}}}'"))
    print("Fatto. Il vecchio e' spento e intatto (via di ritorno). Dopo qualche giorno: --chiudi")


def chiudi():
    vecchio = server(VECCHIO_NOME)
    if not vecchio:
        raise SystemExit("il vecchio server non c'e' piu'")
    print("[1] istantanea del vecchio (via di ritorno a pochi centesimi al mese)")
    r = api("POST", f"/servers/{vecchio['id']}/actions/create_image", {"type": "snapshot", "description": "platinatore-cms CAX11 prima del trasloco"})
    aspetta_azione(r["action"])
    print("[2] cancello il vecchio server")
    api("DELETE", f"/servers/{vecchio['id']}")
    print("Fatto.")


if __name__ == "__main__":
    fase = next((a for a in sys.argv[1:] if a.startswith("--")), "--stato")
    {"--stato": stato, "--prepara": prepara, "--cambia": cambia, "--chiudi": chiudi}[fase]()
