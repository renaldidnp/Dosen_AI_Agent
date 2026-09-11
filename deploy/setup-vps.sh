#!/usr/bin/env bash
# ============================================================
# setup-vps.sh — Setup SwaKoreksiIn di VPS Ubuntu 24.04 (sekali saja)
#
# Yang dilakukan:
#   1. Install Docker, Docker Compose plugin, Nginx, Git
#   2. Ambil kode (clone GitHub atau pakai repo yang sudah ada)
#   3. Generate .env produksi dari env.production.example
#      (secret random dibuat otomatis; API key diisi manual)
#   4. Cetak petunjuk langkah selanjutnya
#
# Cara pakai:
#   sudo bash deploy/setup-vps.sh
# ============================================================
set -euo pipefail

IP_PUBLIK="${1:-}"
GIT_REPO="https://github.com/renaldidnp/Dosen_AI_Agent.git"
APP_DIR="/root/Dosen_AI_Agent"

c_cyan='\033[0;36m'; c_green='\033[0;32m'; c_yellow='\033[1;33m'; c_red='\033[0;31m'; c_off='\033[0m'
info()  { printf "${c_cyan}[INFO]${c_off} %s\n" "$*"; }
ok()    { printf "${c_green}[OK]${c_off} %s\n" "$*"; }
warn()  { printf "${c_yellow}[WARN]${c_off} %s\n" "$*"; }
err()   { printf "${c_red}[ERROR]${c_off} %s\n" "$*" >&2; }

if [ "$(id -u)" -ne 0 ]; then
  err "Jalankan sebagai root (sudo)."
  exit 1
fi

# ------------------------------------------------------------
# 1. Sistem update + install dependensi
# ------------------------------------------------------------
info "Mengupdate sistem & menginstall Docker, Compose, Nginx..."
apt-get update -y
apt-get install -y docker.io docker-compose-plugin nginx git
systemctl enable --now docker
systemctl enable --now nginx
ok "Docker $(docker --version) | Compose $(docker compose version)"

# ------------------------------------------------------------
# 2. Ambil kode aplikasi
# ------------------------------------------------------------
if [ -d "$APP_DIR/.git" ]; then
  info "Repositori sudah ada di $APP_DIR — menjalankan git pull..."
  cd "$APP_DIR"
  git pull --ff-only
else
  info "Mengkloning repo ke $APP_DIR ..."
  git clone "$GIT_REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

if [ ! -f docker-compose.yml ]; then
  err "docker-compose.yml tidak ditemukan di $APP_DIR. Pastikan commit deploy sudah ter-push ke GitHub."
  exit 1
fi

# ------------------------------------------------------------
# 3. Deteksi IP publik
# ------------------------------------------------------------
if [ -z "$IP_PUBLIK" ]; then
  IP_PUBLIK="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi
info "IP publik terdeteksi: ${IP_PUBLIK:-<GAGAL DETEKSI, isi manual>}"

# ------------------------------------------------------------
# 4. Generate .env untuk app dan agent
# ------------------------------------------------------------
gen_secret() { openssl rand -hex 24; }
MYSQL_PASSWORD="$(gen_secret)"
JWT_SECRET="$(gen_secret)"
AGENT_SECRET="$(gen_secret)"
CALLBACK_SECRET="$(gen_secret)"

env_app_path="$APP_DIR/autograder-app/.env"
env_agent_path="$APP_DIR/autograder-agent/api-wrapper/.env"

# --- autograder-app/.env ---
if [ -f "$env_app_path" ]; then
  warn "$env_app_path sudah ada — tidak menimpa (biarkan isi manual kamu)."
else
  cat > "$env_app_path" <<EOF
DATABASE_URL="mysql://root:${MYSQL_PASSWORD}@mysql:3306/autograder"
APP_URL="http://${IP_PUBLIK}"
WEBHOOK_SECRET="${CALLBACK_SECRET}"
AGENT_CALLBACK_SECRET="${CALLBACK_SECRET}"
AGENT_API_URL="http://agent:4000"
AGENT_SECRET="${AGENT_SECRET}"
JWT_SECRET="${JWT_SECRET}"
GOOGLE_CLIENT_ID="ISI_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="ISI_GOOGLE_CLIENT_SECRET"
GOOGLE_REFRESH_TOKEN="ISI_GOOGLE_REFRESH_TOKEN"
GOOGLE_DRIVE_FOLDER_ID="ISI_GOOGLE_DRIVE_FOLDER_ID"
RESEND_API_KEY="ISI_RESEND_API_KEY"
EOF
  ok "Membuat $env_app_path"
fi

# --- autograder-agent/api-wrapper/.env ---
if [ -f "$env_agent_path" ]; then
  warn "$env_agent_path sudah ada — tidak menimpa."
else
  cat > "$env_agent_path" <<EOF
PORT=4000
CALLBACK_URL="http://${IP_PUBLIK}/api/webhook/grade-callback"
AGENT_CALLBACK_SECRET="${CALLBACK_SECRET}"
AGENT_SECRET="${AGENT_SECRET}"
LLM_PROVIDERS="gemini"
GEMINI_API_KEY="ISI_GEMINI_API_KEY"
GEMINI_API_KEY_2=""
GEMINI_MODEL="gemini-3.6-flash"
OPENROUTER_API_KEY=""
OPENROUTER_MODEL="deepseek/deepseek-chat"
GROQ_API_KEY=""
GROQ_MODEL="llama-3.3-70b-versatile"
GOOGLE_CLIENT_ID="ISI_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="ISI_GOOGLE_CLIENT_SECRET"
GOOGLE_REFRESH_TOKEN="ISI_GOOGLE_REFRESH_TOKEN"
EOF
  ok "Membuat $env_agent_path"
fi

# ------------------------------------------------------------
# 5. Verifikasi MYSQL_PASSWORD konsisten dengan .env app
# ------------------------------------------------------------
if ! grep -q "MYSQL_ROOT_PASSWORD" "$APP_DIR/docker-compose.yml" 2>/dev/null; then
  cat > "$APP_DIR/.env" <<EOF
MYSQL_ROOT_PASSWORD=${MYSQL_PASSWORD}
EOF
  ok "Menyimpan MYSQL_ROOT_PASSWORD ke $APP_DIR/.env (dibaca docker compose)"
fi

# ------------------------------------------------------------
# 6. Petunjuk
# ------------------------------------------------------------
echo ""
echo "=============================================================="
printf "${c_green}Setup selesai!${c_off}\n"
echo "=============================================================="
echo ""
echo "LANGKAH BERIKUT (WAJIB):"
if grep -q "ISI_" "$env_app_path" 2>/dev/null || grep -q "ISI_" "$env_agent_path" 2>/dev/null; then
  echo "  1. Isi API keys di file .env berikut:"
  echo "       nano $env_app_path"
  echo "       nano $env_agent_path"
  echo "     (ganti semua value yang diawali 'ISI_')"
  echo ""
fi
echo "  2. Jalankan:"
echo "       cd $APP_DIR && bash deploy/start.sh"
echo ""
echo "  Jika IP berubah, sesuaikan APP_URL / CALLBACK_URL di kedua .env."
echo "=============================================================="