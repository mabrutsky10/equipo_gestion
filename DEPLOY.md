# Guía de Despliegue - Equipo Gestión

Esta guía explica cómo desplegar el proyecto en GitHub y Vercel.

## 1. Crear Repositorio en GitHub

### Opción A: Usando GitHub CLI (recomendado)

```bash
# Instalar GitHub CLI si no lo tienes
# brew install gh  # macOS
# o descargar desde https://cli.github.com

# Autenticarse
gh auth login

# Crear el repositorio
cd "/Volumes/SSD Ext Main/dev/landings-github-vercel/tesorero"
gh repo create equipo_gestion --public --source=. --remote=origin --push
```

### Opción B: Desde la Web de GitHub

1. Ve a https://github.com/new
2. Nombre del repositorio: `equipo_gestion`
3. Visibilidad: Público o Privado (según prefieras)
4. **NO** inicialices con README, .gitignore o licencia (ya los tenemos)
5. Click en "Create repository"

Luego ejecuta estos comandos:

```bash
cd "/Volumes/SSD Ext Main/dev/landings-github-vercel/tesorero"

# Inicializar git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "Initial commit: Equipo Gestión"

# Agregar el remoto (reemplaza TU_USUARIO con tu usuario de GitHub)
git remote add origin https://github.com/TU_USUARIO/equipo_gestion.git

# Cambiar a la rama main
git branch -M main

# Subir el código
git push -u origin main
```

## 2. Configurar Variables de Entorno

### Backend (si lo despliegas en otro servicio)

Las variables de entorno del backend están en `backend/.env`:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `AUTH_SECRET_KEY`
- `CORS_ORIGINS`

### Frontend (Vercel)

En Vercel, configura estas variables de entorno:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega:
   - `VITE_API_BASE_URL`: URL de tu backend API (ej: `https://tu-backend.railway.app/api/v1`)

## 3. Desplegar Frontend en Vercel

### Opción A: Desde la Web de Vercel

1. Ve a https://vercel.com/new
2. Importa tu repositorio de GitHub: `equipo_gestion`
3. Configuración del proyecto:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Agrega las variables de entorno (ver sección anterior)
5. Click en "Deploy"

### Opción B: Usando Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde el directorio del proyecto
cd "/Volumes/SSD Ext Main/dev/landings-github-vercel/tesorero"

# Iniciar despliegue
vercel

# Seguir las instrucciones interactivas
# - Link to existing project? No
# - Project name: equipo-gestion
# - Directory: frontend
# - Override settings? No
```

### Configuración Manual de Vercel

Si necesitas ajustar la configuración, edita `vercel.json`:

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm install",
  "framework": "vite"
}
```

## 4. Desplegar Backend (Opcional)

El backend de FastAPI necesita un servidor que soporte Python. Opciones:

### Opción A: Railway (Recomendado)

1. Ve a https://railway.app
2. New Project → Deploy from GitHub repo
3. Selecciona `equipo_gestion`
4. Configura:
   - **Root Directory**: `backend`
   - **Start Command**: `uvicorn app.presentation.api.main:app --host 0.0.0.0 --port $PORT`
5. Agrega las variables de entorno desde `backend/.env`
6. Railway generará una URL como `https://tu-proyecto.railway.app`

### Opción B: Render

1. Ve a https://render.com
2. New → Web Service
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `equipo-gestion-backend`
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.presentation.api.main:app --host 0.0.0.0 --port $PORT`
5. Agrega las variables de entorno

### Opción C: AWS Lambda + API Gateway

Requiere configuración adicional. Consulta la documentación de FastAPI para serverless.

## 5. Actualizar CORS en Backend

Una vez que tengas la URL de producción del frontend, actualiza `CORS_ORIGINS` en el backend:

```env
CORS_ORIGINS=https://equipo-gestion.vercel.app,https://tu-dominio.com
```

## 6. Verificar Despliegue

1. Frontend: Visita la URL de Vercel (ej: `https://equipo-gestion.vercel.app`)
2. Backend: Visita la URL del backend + `/docs` (ej: `https://tu-backend.railway.app/docs`)
3. Verifica que el frontend pueda conectarse al backend

## Troubleshooting

### Frontend no se conecta al backend

- Verifica que `VITE_API_BASE_URL` esté configurado correctamente en Vercel
- Verifica que CORS en el backend permita el origen de Vercel
- Revisa la consola del navegador para errores

### Build falla en Vercel

- Verifica que `package.json` tenga el script `build`
- Verifica que todas las dependencias estén en `package.json`
- Revisa los logs de build en Vercel

### Backend no inicia

- Verifica que todas las variables de entorno estén configuradas
- Verifica que la base de datos sea accesible desde el servicio de hosting
- Revisa los logs del servicio

## Notas

- El frontend se despliega automáticamente en cada push a `main` si configuraste Vercel con GitHub
- El backend necesita ser desplegado por separado en un servicio que soporte Python
- Considera usar un servicio de base de datos gestionado (Supabase, Railway, etc.) para producción

