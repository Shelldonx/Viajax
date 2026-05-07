#!/bin/bash
MSG="${1:-chore: auto-deploy $(date '+%Y-%m-%d %H:%M')}"
echo "📤 Git: commit + push → main"
git add .
git commit -m "$MSG" --allow-empty
git push origin main
echo "✅ Push completo → https://github.com/Shelldonx/Viajax"
