#!/bin/bash
set -e

# Carrega variáveis do .env.local se existir
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-u311001338_viajaxdata}"
DB_USER="${DB_USER:-u311001338_shelldonxdata}"
DB_PASS="${DB_PASS}"

BACKUP_FILE="./backups/backup-$(date +%Y%m%d-%H%M%S).sql"
mkdir -p ./backups

echo "💾 A fazer backup da base de dados..."
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || echo "⚠️  Backup falhou (base vazia ou sem acesso local)"
echo "✅ Backup guardado: $BACKUP_FILE"

echo "🗄️ A criar tabela de controlo de migrações..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "
CREATE TABLE IF NOT EXISTS _migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
" 2>/dev/null

echo "🔄 A executar migrações pendentes..."
for file in ./migrations/*.sql; do
  [ -f "$file" ] || continue
  filename=$(basename "$file")
  exists=$(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -sN -e \
    "SELECT COUNT(*) FROM _migrations WHERE filename='$filename';" 2>/dev/null)
  if [ "$exists" -eq "0" ]; then
    echo "  ▶ A executar: $filename"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "$file" 2>/dev/null
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e \
      "INSERT INTO _migrations (filename) VALUES ('$filename');" 2>/dev/null
    echo "  ✅ $filename executado com sucesso"
  else
    echo "  ⏭ $filename já executado — ignorar"
  fi
done
echo "✅ Migrações concluídas"
