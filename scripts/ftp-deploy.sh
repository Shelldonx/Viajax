#!/bin/bash
set -e

# Carrega variáveis do .env.local se existir
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

FTP_HOST="109.106.245.63"
FTP_PORT="21"
FTP_USER="u311001338.viajax.es"
FTP_PASS="Farinha@2"
FTP_ROOT="/home/u311001338/domains/viajax.es/public_html"

echo "📁 A fazer upload para viajax.es via FTP..."

lftp -u "$FTP_USER","$FTP_PASS" ftp://"$FTP_HOST":"$FTP_PORT" <<EOF
set ssl:verify-certificate no
set ftp:passive-mode yes
mirror -R --delete \
  --exclude node_modules/ \
  --exclude .git/ \
  --exclude .env.local \
  --exclude .env \
  --exclude logs/ \
  --exclude backups/ \
  --exclude "*.log" \
  --exclude "*.sql.bak" \
  .next/standalone/ $FTP_ROOT
put public/.htaccess -o $FTP_ROOT/.htaccess
mirror -R --delete public/ $FTP_ROOT/public/
bye
EOF

echo "✅ Upload FTP completo"
