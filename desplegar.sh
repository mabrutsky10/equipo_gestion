#!/bin/bash

# Script maestro para desplegar backend en Render y frontend en Vercel
# Uso: ./desplegar.sh

set -e

BACKEND_URL="https://equipo-gestion-backend.onrender.com"
SERVICE_ID="srv-d4el7eqdbo4c73dj1g70"

echo "🚀 Iniciando proceso de despliegue completo..."
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ============================================
# PASO 1: Desplegar Backend en Render
# ============================================
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}PASO 1: Desplegando Backend en Render${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo ""

# Hacer commit y push de los cambios
echo "📦 Haciendo commit y push de cambios..."
git add -A
if ! git diff --staged --quiet; then
    git commit -m "Deploy: Auto-deploy $(date +%Y-%m-%d\ %H:%M:%S)" || echo "No hay cambios para commitear"
fi
git push origin main

echo ""
echo "✅ Código subido a GitHub"
echo "⏳ Esperando que Render detecte el cambio y despliegue..."
echo ""

# Esperar a que Render detecte el nuevo commit
sleep 10

# Verificar el estado del deploy en Render usando la API
echo "🔍 Verificando estado del deploy en Render..."
MAX_ATTEMPTS=30
ATTEMPT=0
DEPLOY_SUCCESS=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    # Obtener el último deploy usando la API de Render
    DEPLOY_RESPONSE=$(curl -s -X GET \
        "https://api.render.com/v1/services/$SERVICE_ID/deploys?limit=1" \
        -H "Authorization: Bearer rnd_0hVcj2pB7BloQ1q3OSyN6RtEvrLG" \
        -H "Accept: application/json" 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$DEPLOY_RESPONSE" ] && [ "$DEPLOY_RESPONSE" != "null" ]; then
        DEPLOY_STATUS=$(echo "$DEPLOY_RESPONSE" | jq -r '.[0].status // "unknown"' 2>/dev/null || echo "unknown")
        DEPLOY_ID=$(echo "$DEPLOY_RESPONSE" | jq -r '.[0].id // "unknown"' 2>/dev/null || echo "unknown")
        
        if [ "$DEPLOY_STATUS" != "unknown" ]; then
            echo "   Estado del deploy: $DEPLOY_STATUS"
            
            if [ "$DEPLOY_STATUS" = "live" ]; then
                echo -e "${GREEN}✅ Backend desplegado exitosamente!${NC}"
                DEPLOY_SUCCESS=true
                break
            elif [ "$DEPLOY_STATUS" = "build_failed" ] || [ "$DEPLOY_STATUS" = "update_failed" ]; then
                echo -e "${RED}❌ El deploy falló en Render${NC}"
                echo "   Revisa los logs en: https://dashboard.render.com/web/$SERVICE_ID"
                exit 1
            fi
        fi
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        echo "   Esperando... ($ATTEMPT/$MAX_ATTEMPTS)"
        sleep 10
    fi
done

if [ "$DEPLOY_SUCCESS" = false ]; then
    echo -e "${YELLOW}⚠️  Timeout esperando el deploy. Continuando con la verificación del backend...${NC}"
fi

echo ""

# ============================================
# PASO 2: Verificar Backend
# ============================================
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}PASO 2: Verificando Backend${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo ""

echo "🔍 Verificando que el backend responda..."
sleep 5

# Verificar health check
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/" || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✅ Backend respondiendo correctamente (HTTP $HEALTH_CHECK)${NC}"
    
    # Verificar que la API docs esté disponible
    DOCS_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/docs" || echo "000")
    if [ "$DOCS_CHECK" = "200" ]; then
        echo -e "${GREEN}✅ API docs disponible en $BACKEND_URL/docs${NC}"
    fi
else
    echo -e "${RED}❌ Backend no responde correctamente (HTTP $HEALTH_CHECK)${NC}"
    echo "   URL: $BACKEND_URL"
    exit 1
fi

echo ""

# ============================================
# PASO 3: Actualizar Variables de Entorno en Vercel
# ============================================
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}PASO 3: Actualizando Variables en Vercel${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo ""

if [ -f "./update-vercel-env.sh" ]; then
    chmod +x ./update-vercel-env.sh
    ./update-vercel-env.sh
else
    echo "⚠️  Script update-vercel-env.sh no encontrado"
    echo "   Actualiza manualmente VITE_API_BASE_URL en Vercel a: $BACKEND_URL/api/v1"
fi

echo ""

# ============================================
# PASO 4: Desplegar Frontend en Vercel
# ============================================
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo -e "${YELLOW}PASO 4: Desplegando Frontend en Vercel${NC}"
echo -e "${YELLOW}════════════════════════════════════════${NC}"
echo ""

echo "🚀 Desplegando frontend en Vercel..."
cd "/Volumes/SSD Ext Main/dev/landings-github-vercel/tesorero"

# Desplegar en producción
vercel --prod --yes

echo ""
echo -e "${GREEN}✅ Frontend desplegado en Vercel!${NC}"
echo ""

# ============================================
# RESUMEN
# ============================================
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ DESPLIEGUE COMPLETADO${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo "📍 Backend: $BACKEND_URL"
echo "📍 Frontend: https://equipo-gestion.vercel.app"
echo ""
echo "🔍 Verifica:"
echo "   - Backend API: $BACKEND_URL/docs"
echo "   - Frontend: https://equipo-gestion.vercel.app"
echo ""

