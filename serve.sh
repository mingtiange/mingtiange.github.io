#!/usr/bin/env bash
# 观象 · 本地预览
# 用法： ./serve.sh [端口]        默认 8080
set -euo pipefail

cd "$(dirname "$0")"
PORT="${1:-8080}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "需要 python3 才能启动本地服务器。" >&2
  exit 1
fi

URL="http://127.0.0.1:${PORT}/"
echo ""
echo "  观象 · 周易占卜"
echo "  ${URL}"
echo "  Ctrl+C 停止"
echo ""

# 有图形界面时顺手打开浏览器（失败不影响）
if [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ] && command -v xdg-open >/dev/null 2>&1; then
  ( sleep 0.6; xdg-open "$URL" >/dev/null 2>&1 || true ) &
fi

exec python3 -m http.server "$PORT" --bind 127.0.0.1
