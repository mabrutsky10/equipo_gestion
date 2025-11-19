#!/bin/bash

# Script para actualizar variables de entorno en Vercel
# Uso: ./update-vercel-env.sh

set -e

VARIABLE_NAME="VITE_API_BASE_URL"
VARIABLE_VALUE="https://equipo-gestion-backend.onrender.com/api/v1"

echo "🔧 Actualizando variable de entorno en Vercel..."
echo ""
echo "📋 Variable: $VARIABLE_NAME"
echo "📋 Valor: $VARIABLE_VALUE"
echo ""

# Para cada entorno (production, preview, development)
for ENV in production preview development; do
    echo "🔄 Actualizando $ENV..."
    
    # Eliminar la variable existente usando el CLI de Vercel
    echo "y" | vercel env rm "$VARIABLE_NAME" "$ENV" 2>/dev/null || echo "   Variable no existía o ya fue eliminada"
    
    # Agregar la nueva variable usando el CLI de Vercel
    echo "$VARIABLE_VALUE" | vercel env add "$VARIABLE_NAME" "$ENV" 2>&1 | grep -q "Added\|updated" && \
        echo "   ✅ $ENV actualizado correctamente" || \
        echo "   ⚠️  Revisa manualmente el estado de $ENV"
done

echo ""
echo "✅ Variables de entorno actualizadas en Vercel!"
echo ""

