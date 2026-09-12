#!/usr/bin/env bash
# ============================================================
# demo-logs.sh — Tampilan log 3-pane untuk demo video
#
# Menampilkan bukti project benar-benar berjalan di VPS:
#   1. FRONTEND  : docker compose logs -f app
#   2. AGENT AI  : docker compose logs -f agent
#   3. AKSES WEB : tail -f /var/log/nginx/access.log
#
# Cara pakai (di VPS):
#   bash deploy/demo-logs.sh
#   atau: bash /root/demo-logs.sh
#
# Keluar: Ctrl-b lalu 'd' (session tetap jalan)
# Attach lagi: tmux attach -t demo
# ============================================================
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ ! -f "$APP_DIR/docker-compose.yml" ]; then
  APP_DIR="/root/Dosen_AI_Agent"
fi
cd "$APP_DIR"

SESSION="${DEMO_SESSION:-demo}"
ACCESS_LOG="${ACCESS_LOG:-/var/log/nginx/access.log}"

# buang noise stack-trace & retry agar layar rapi saat direkam
NOISE='app-page.runtime|AsyncLocalStorage|Object.wrap|node_modules|Retry|percobaan|Failed to find Server Action'

if ! command -v tmux >/dev/null 2>&1; then
  echo "[ERROR] tmux tidak terpasang. Install: apt-get install -y tmux"
  exit 1
fi
if ! docker compose ps >/dev/null 2>&1; then
  echo "[ERROR] docker compose tidak jalan di $APP_DIR"
  exit 1
fi

tmux kill-session -t "$SESSION" 2>/dev/null || true

# ------------------------------------------------------------
# Bangun layout: 2 pane atas (FRONTEND | AGENT), 1 pane bawah (NGINX)
# ------------------------------------------------------------
tmux new-session -d -s "$SESSION" -n logs -x 220 -y 50
tmux split-window -v -l 40% -t "$SESSION:logs.0"   # bawah (full width)
tmux split-window -h -t "$SESSION:logs.0"          # kanan atas

# tmux merenumber pane setelah split — petakan via posisi geometri.
# Pane printer: "index:left:top" ; awali memakai pesta agar bersih.
PANE_MAP="$(tmux list-panes -t "$SESSION:logs" -F '#{pane_index}:#{pane_left}:#{pane_top}')"
P_NGINX="$(echo "$PANE_MAP" | awk -F: '$3>0 {print $1; exit}')"
P_FRONT="$(echo "$PANE_MAP" | awk -F: '$3==0 && $2==0 {print $1; exit}')"
P_AGENT="$(echo "$PANE_MAP" | awk -F: '$3==0 && $2>0 {print $1; exit}')"

tmux send-keys -t "$SESSION:logs.$P_FRONT" \
  "clear; echo '=== FRONTEND (swakoreksiin-app) ==='; docker compose logs -f --tail 20 app 2>&1 | grep --line-buffered -vE '$NOISE'" C-m
tmux send-keys -t "$SESSION:logs.$P_AGENT" \
  "clear; echo '=== AGENT AI (swakoreksiin-agent) ==='; docker compose logs -f --tail 20 agent 2>&1 | grep --line-buffered -vE '$NOISE'" C-m
tmux send-keys -t "$SESSION:logs.$P_NGINX" \
  "clear; echo '=== AKSES WEB (nginx access.log) ==='; tail -f '$ACCESS_LOG'" C-m

# judul pane + border
tmux select-pane -t "$SESSION:logs.$P_FRONT" -T " FRONTEND "
tmux select-pane -t "$SESSION:logs.$P_AGENT" -T " AGENT AI "
tmux select-pane -t "$SESSION:logs.$P_NGINX" -T " AKSES WEB "
tmux set -t "$SESSION" pane-border-status top
tmux select-pane -t "$SESSION:logs.$P_FRONT"

# ringkasan status container sebelum masuk tmux
echo "=============================================================="
docker compose ps --format "table {{.Name}}\t{{.Status}}"
echo "=============================================================="
echo " tmux: Ctrl-b + 'o' = pindah pane | Ctrl-b + 'd' = keluar"
echo " attach lagi: tmux attach -t $SESSION"
echo "=============================================================="

if [ -n "${TMUX:-}" ]; then
  exec tmux switch-client -t "$SESSION"
else
  exec tmux attach -t "$SESSION"
fi
