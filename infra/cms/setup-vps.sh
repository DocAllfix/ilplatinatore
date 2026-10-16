#!/usr/bin/env bash
# Prepara la macchina del CMS (Hetzner CAX11 ARM, Ubuntu 24.04). Si lancia una volta, come root.
# E' idempotente: rilanciarlo non rompe niente.
#
# Il muro vero e' il firewall di Hetzner (22 solo dall'IP di amministrazione, 80/443/ICMP aperti).
# ufw qui e' solo una seconda difesa: i container Docker con porte pubblicate lo scavalcano.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo "[setup] aggiornamento del sistema"
apt-get update -q
apt-get -y -q upgrade
apt-get -y -q install ca-certificates curl gnupg rsync fail2ban unattended-upgrades

echo "[setup] Docker dal repository ufficiale (ha i pacchetti arm64)"
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  . /etc/os-release
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -q
  apt-get -y -q install docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi
systemctl enable --now docker

echo "[setup] swap di 2 GB: con 4 GB di RAM, un import grande o un aggiornamento non devono far chiudere MariaDB"
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi
swapon --show | grep -q /swapfile || swapon /swapfile
echo 'vm.swappiness=10' > /etc/sysctl.d/90-swappiness.conf
sysctl -q -p /etc/sysctl.d/90-swappiness.conf

echo "[setup] aggiornamenti di sicurezza automatici"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

echo "[setup] SSH solo a chiave"
# Solo se una chiave e' autorizzata: altrimenti si resterebbe chiusi fuori dalla macchina.
if [ -s /root/.ssh/authorized_keys ]; then
  cat > /etc/ssh/sshd_config.d/10-platinatore.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
  # Con SSH avviato dal socket (Ubuntu 24.04) /run/sshd non esiste finche' il servizio non parte,
  # e `sshd -t` fallisce per questo e non per la configurazione.
  mkdir -p /run/sshd
  sshd -t
  # `reload ssh` fallisce quando SSH parte dal socket, e con `set -e` interromperebbe lo script
  # (trappola gia' pagata nel riferimento di Evalis Academy). Le connessioni aperte non cadono.
  systemctl reload ssh 2>/dev/null \
    || systemctl reload sshd 2>/dev/null \
    || systemctl restart ssh.socket
else
  echo "[setup] ATTENZIONE: nessuna chiave in /root/.ssh/authorized_keys, password lasciata attiva" >&2
fi

echo "[setup] fail2ban sulla porta SSH"
cat > /etc/fail2ban/jail.local <<'EOF'
[sshd]
enabled = true
maxretry = 5
bantime = 3600
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "[setup] ufw come seconda difesa"
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22/tcp >/dev/null
ufw allow 80/tcp >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

mkdir -p /opt/platinatore-cms
echo "[setup] fatto: $(docker --version) | $(docker compose version)"
