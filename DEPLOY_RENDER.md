# Desplegar Backend en Render

## Opción 1: Desde el Dashboard (Recomendado)

1. Ve a https://dashboard.render.com
2. Click en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub: `mabrutsky10/equipo_gestion`
4. Render detectará automáticamente el archivo `render.yaml` y usará esa configuración
5. Si no detecta el `render.yaml`, configura manualmente:
   - **Name**: `equipo-gestion-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.presentation.api.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`
   - **Plan**: `Free`
6. Agrega las variables de entorno (ver sección Variables de Entorno)
7. Click en "Create Web Service"

## Opción 2: Usando Render CLI (Requiere workspace configurado)

```bash
# Configurar workspace (si no está configurado)
render workspace set

# El CLI abrirá un menú interactivo para crear el servicio
render services create
```

## Variables de Entorno Necesarias

Configura estas variables en el dashboard de Render (Settings → Environment):

```bash
DB_HOST=tu-host-de-postgresql
DB_PORT=5432
DB_USER=tu-usuario
DB_PASSWORD=tu-password
DB_NAME=tu-database
AUTH_SECRET_KEY=tu-secret-key-muy-segura
CORS_ORIGINS=https://equipo-gestion.vercel.app,https://tu-dominio.com
```

### Generar AUTH_SECRET_KEY

```bash
# En tu terminal local
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Notas Importantes

1. **Base de Datos**: Asegúrate de que tu base de datos PostgreSQL sea accesible desde internet (no solo localhost)
2. **CORS**: Actualiza `CORS_ORIGINS` con la URL de producción de tu frontend en Vercel
3. **Health Check**: El servicio tiene un health check en `/` que Render usará para verificar que está funcionando
4. **Cold Starts**: En el plan gratuito, el servicio puede entrar en suspensión después de 15 minutos de inactividad

## Verificar el Despliegue

Una vez desplegado, Render te dará una URL como:
`https://equipo-gestion-backend.onrender.com`

Verifica que funciona:
- Health check: `https://equipo-gestion-backend.onrender.com/`
- API docs: `https://equipo-gestion-backend.onrender.com/docs`

## Actualizar Frontend en Vercel

Después de obtener la URL del backend, actualiza la variable de entorno en Vercel:

```bash
vercel env rm VITE_API_BASE_URL production
echo "https://equipo-gestion-backend.onrender.com/api/v1" | vercel env add VITE_API_BASE_URL production
```

Luego haz un redeploy:
```bash
vercel --prod
```

