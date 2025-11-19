# Actualizar Variables de Entorno en Vercel

## Variable a Actualizar

**VITE_API_BASE_URL** debe apuntar a:
```
https://equipo-gestion-backend.onrender.com/api/v1
```

## Pasos para Actualizar

1. Ve a: https://vercel.com/maxs-projects-79d9788b/equipo-gestion/settings/environment-variables

2. Para cada entorno (Production, Preview, Development):
   - Haz click en el icono de editar (✏️) junto a `VITE_API_BASE_URL`
   - Cambia el valor a: `https://equipo-gestion-backend.onrender.com/api/v1`
   - Guarda

3. O simplemente:
   - Elimina la variable `VITE_API_BASE_URL` de los 3 entornos
   - Agrega nuevamente con el valor: `https://equipo-gestion-backend.onrender.com/api/v1`

4. Después de actualizar, haz un redeploy:
   ```bash
   vercel --prod
   ```

## Verificación

Una vez actualizado, verifica que el frontend pueda conectarse al backend:
- Abre la consola del navegador
- Deberías ver que las peticiones van a `https://equipo-gestion-backend.onrender.com/api/v1`

