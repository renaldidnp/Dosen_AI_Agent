#!/usr/bin/env bash
# ============================================================
# start.sh — Build, running & setup Nginx untuk SwaKoreksiIn
#
# Dipakai setelah setup-vps.sh (atau saat deploy ulang).
# Idempoten: aman dijalankan berulang kali.
#
# Cara pakai:
#   bash deploy/start.sh
# ============================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$APP_DIR"

c_cyan='\033[0;36m'; c_green='\033[0;32m'; c_yellow='\033[1;33m'; c_red='\033[0;31m'; c_off='\033[0m'
info() { printf "${c_cyan}[INFO]${c_off} %s\n" "$*"; }
ok()   { printf "${c_green}[OK]${c_off} %s\n" "$*"; }
warn() { printf "${c_yellow}[WARN]${c_off} %s\n" "$*"; }
err()  { printf "${c_red}[ERROR]${c_off} %s\n" "$*" >&2; }

if [ "$(id -u)" -ne 0 ]; then
  err "Jalankan sebagai root (sudo)."
  exit 1
fi

# ------------------------------------------------------------
# Cek .env sudah diisi API keys
# ------------------------------------------------------------
for f in "autograder-app/.env" "autograder-agent/api-wrapper/.env"; do
  if [ ! -f "$APP_DIR/$f" ]; then
    err "$f belum ada. Jalankan deploy/setup-vps.sh dulu."
    exit 1
  fi
  if grep -q "ISI_" "$APP_DIR/$f" 2>/dev/null; then
    warn "$f masih mengandung placeholder 'ISI_'. Grading/AI/Drive/Email akan gagal sampai diisi."
  fi
done

# ------------------------------------------------------------
# Ambil APP_URL dari .env app
# ------------------------------------------------------------
APP_URL="$(grep -E '^APP_URL=' "$APP_DIR/autograder-app/.env" | cut -d= -f2- | tr -d '"' | tr -d "'")"
APP_URL="${APP_URL:-http://localhost}"
HOST_ONLY="$(echo "$APP_URL" | sed -E 's|^https?://||; s|/.*$||')"
info "APP_URL = $APP_URL (host: $HOST_ONLY)"

# ------------------------------------------------------------
# Build & start container
# ------------------------------------------------------------
info "Menjalankan: docker compose up -d --build ..."
if [ -f "$APP_DIR/.env" ]; then
  set -a; . "$APP_DIR/.env"; set +a
fi
docker compose up -d --build

# ------------------------------------------------------------
# Tunggu MySQL healthy, lalu push Prisma schema
# ------------------------------------------------------------
info "Menunggu MySQL siap..."
for i in $(seq 1 30); do
  st=$(docker inspect --format '{{.State.Health.Status}}' swakoreksiin-mysql 2>/dev/null || echo "unknown")
  [ "$st" = "healthy" ] && break
  echo "  ... ($i) status: $st"
  sleep 2
done

if [ "$st" != "healthy" ]; then
  warn "MySQL belum healthy dalam 60 detik. Periksa: docker compose logs mysql"
else
  ok "MySQL healthy — push Prisma schema..."
  docker exec -e HOME=/tmp swakoreksiin-app npx prisma db push
fi

# ------------------------------------------------------------
# Nginx reverse proxy (ke port 3000)
# ------------------------------------------------------------
NGINX_SITE="/etc/nginx/sites-available/swakoreksiin"
NGINX_LINK="/etc/nginx/sites-enabled/swakoreksiin"
if [ -f /etc/nginx/sites-enabled/default ]; then
  rm -f /etc/nginx/sites-enabled/default
fi

cat > "$NGINX_SITE" <<EOF
server {
    listen 80;
    server_name ${HOST_ONLY} _;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
ln -sf "$NGINX_SITE" "$NGINX_LINK"
nginx -t >/dev/null
if [ "$(systemctl is-active nginx)" = "active" ]; then
  nginx -s reload
else
  systemctl start nginx
fi
ok "Nginx dikonfigurasi: http://${HOST_ONLY}"

# ------------------------------------------------------------
# Status akhir
# ------------------------------------------------------------
echo ""
echo "=============================================================="
printf "${c_green}Deploy selesai!${c_off}\n"
echo "=============================================================="
docker compose ps --format "table {{.Name}}\t{{.Status}}"
echo ""
echo "  Aplikasi : ${APP_URL}"
echo "  Agent    : http://${HOST_ONLY}:4000 (hidden, hanya health check publik)"
echo "  Logs app : docker compose logs -f app"
echo "  Logs agent: docker compose logs -f agent"
echo ""
echo "  Deploy ulang setelah update code:"
echo "    cd $APP_DIR && git pull && bash deploy/start.sh"
echo "=============================================================="