#!/bin/bash
set -e
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="./logs/deploy-$(date +%Y%m%d-%H%M%S).log"
mkdir -p ./logs ./backups

echo "🚀 [$TIMESTAMP] Iniciando deploy Viajax → viajax.es" | tee -a "$LOG_FILE"

# 1. Git commit e push
bash scripts/git-push.sh "${1:-deploy automático}" 2>&1 | tee -a "$LOG_FILE"

# 2. Migrar base de dados
bash scripts/migrate.sh 2>&1 | tee -a "$LOG_FILE"

# 3. Build Next.js
echo "🔨 A fazer build..." | tee -a "$LOG_FILE"
npm run build 2>&1 | tee -a "$LOG_FILE"

# 3.5 Copy static assets into standalone (REQUIRED for CSS/JS to work)
echo "📦 Copying static assets into standalone..." | tee -a "$LOG_FILE"
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# 4. Upload FTP
bash scripts/ftp-deploy.sh 2>&1 | tee -a "$LOG_FILE"

# 5. Validar
bash scripts/validate.sh 2>&1 | tee -a "$LOG_FILE"

echo "✅ Deploy completo! Live em https://viajax.es" | tee -a "$LOG_FILE"
