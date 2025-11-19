#!/bin/bash

# Script para configurar el repositorio de GitHub
# Uso: ./setup-github.sh

set -e

echo "🚀 Configurando repositorio de GitHub para equipo_gestion..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "README.md" ]; then
    echo "❌ Error: No se encontró README.md. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Verificar si git está inicializado
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio Git..."
    git init
    echo "✅ Repositorio Git inicializado"
else
    echo "ℹ️  Repositorio Git ya está inicializado"
fi

# Agregar todos los archivos
echo "📝 Agregando archivos al staging..."
git add .

# Verificar si hay cambios para commitear
if git diff --staged --quiet; then
    echo "ℹ️  No hay cambios para commitear"
else
    echo "💾 Creando commit inicial..."
    git commit -m "Initial commit: Equipo Gestión - Team Management Platform"
    echo "✅ Commit creado"
fi

echo ""
echo "✅ Preparación completada!"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1. Crear el repositorio en GitHub:"
echo "   - Ve a https://github.com/new"
echo "   - Nombre: equipo_gestion"
echo "   - NO inicialices con README, .gitignore o licencia"
echo "   - Click en 'Create repository'"
echo ""
echo "2. Conectar el repositorio local con GitHub:"
echo "   git remote add origin https://github.com/mabrutsky/equipo_gestion.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "O usa GitHub CLI:"
echo "   gh repo create equipo_gestion --public --source=. --remote=origin --push"
echo ""

