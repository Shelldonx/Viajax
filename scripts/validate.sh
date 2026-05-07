#!/bin/bash
echo "🔍 A validar https://viajax.es..."
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://viajax.es/ --max-time 30)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Viajax está LIVE — HTTP $HTTP_CODE"
else
  echo "❌ Erro — HTTP $HTTP_CODE — verificar logs"
  exit 1
fi
HEALTH=$(curl -s https://viajax.es/api/health --max-time 10)
echo "🏥 Health check: $HEALTH"
