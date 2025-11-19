# Documentación de Servicios Mas10 API

## Índice
- [Mas10ApiService](#mas10apiservice)
- [Endpoints Utilizados](#endpoints-utilizados)
- [Transformación de Datos](#transformación-de-datos)
- [Manejo de Errores](#manejo-de-errores)
- [Fallbacks](#fallbacks)

---

## Mas10ApiService

### Descripción
Servicio principal para la integración con la API de Mas10. Proporciona métodos para obtener datos de equipos, jugadores, partidos y torneos.

### Ubicación
```python
# Archivo: backend/app/infrastructure/services/mas10_api_service.py
class Mas10ApiService
```

### Configuración
```python
MAS10_BASE_URL = 'https://serviceweb.mas10.ar'
BACKOFFICE_BASE_URL = 'https://backoffice.mas10.ar'
```

---

## Endpoints Utilizados

### 1. **Team Data Endpoint**
```
GET https://serviceweb.mas10.ar/public-content-tables?username={username}&table=team
```

**Propósito**: Obtener información general del equipo y torneos.

**Parámetros**:
- `username`: string - Username del equipo
- `table`: string - Tipo de tabla ("team")

**Respuesta**:
```python
{
  "data": {
    "table_name": "team",
    "id": 123,
    "team_data": {
      "id": 123,
      "name": "Nombre del Equipo",
      "info": "Descripción del equipo",
      "avatar": "https://...",
      "gallery": "https://..." or null,
      "avatar_rembg": "https://...",
      # ... más campos
    },
    "followers": 150,
    "tournaments": [
      {
        "id_tournament": 5689,
        "name_tournament": "Torneo Apertura",
        # ... más campos
      }
    ]
  },
  "error": false
}
```

**Uso en el código**:
```python
# Obtener datos del equipo
from app.infrastructure.services.mas10_api_service import Mas10ApiService

mas10_service = Mas10ApiService()
team_data = await mas10_service.get_team_data('unionyjusticia1')
```

### 2. **Players Endpoint**
```
GET https://backoffice.mas10.ar/team/perfil/players?username={username}&id_tournament={tournamentId}
```

**Propósito**: Obtener lista de jugadores del equipo en un torneo específico.

**Parámetros**:
- `username`: string - Username del equipo
- `id_tournament`: number - ID del torneo

**Respuesta**:
```python
{
  "data": {
    "players": [
      {
        "name": "Nombre Jugador",
        "position": "FW",
        "goal": 5,
        "yellow_card": 2,
        "red_card": 0,
        "count": 10,
        "avatar": "https://..." or null,
        # ... más campos
      }
    ]
  },
  "error": false
}
```

**Uso en el código**:
```python
# Obtener jugadores del equipo
players_data = await mas10_service.get_team_players('unionyjusticia1', tournament_id=5689)
```

### 3. **Matches Endpoint**
```
GET https://backoffice.mas10.ar/team/perfil/matches?username={username}&id_tournament={tournamentId}&limit=true
```

**Propósito**: Obtener partidos del equipo en un torneo específico.

**Parámetros**:
- `username`: string - Username del equipo
- `id_tournament`: number - ID del torneo
- `limit`: boolean - Limitar resultados

**Respuesta**:
```python
{
  "data": {
    "matches": [
      {
        "id": "match_123",
        "date": "2025-01-20",
        "home_team": "Equipo Local",
        "away_team": "Equipo Visitante",
        "home_score": 2,
        "away_score": 1,
        "goal_scorers": [
          {
            "name": "Jugador",
            "minute": 15
          }
        ],
        # ... más campos
      }
    ]
  },
  "error": false
}
```

**Uso en el código**:
```python
# Obtener partidos del equipo
matches_data = await mas10_service.get_team_matches('unionyjusticia1', tournament_id=5689)
```

---

## Transformación de Datos

Los datos de la API de Mas10 se devuelven tal cual se reciben, sin transformación adicional. El frontend puede acceder directamente a todos los campos de la respuesta.

### Estructura de Respuesta del Team Data
La respuesta completa del endpoint `/public-content-tables?username={username}&table=team` contiene todos los datos del equipo y se devuelve directamente al frontend para su visualización.

---

## Manejo de Errores

### Estrategia de Fallback
```python
try:
    # Intentar obtener datos reales de Mas10 API
    mas10_data = await mas10_service.get_team_data(username)
    return mas10_data
except Exception as api_error:
    logger.error(f"Failed to fetch from Mas10 API for username {username}: {api_error}")
    
    # Si no hay resultados, usar por defecto 'unionyjusticia1'
    if username != 'unionyjusticia1':
        try:
            mas10_data = await mas10_service.get_team_data('unionyjusticia1')
            return mas10_data
        except Exception:
            raise HTTPException(status_code=404, detail="Team not found")
    else:
        raise HTTPException(status_code=404, detail="Team not found")
```

### Tipos de Errores Manejados
1. **Network Errors**: Fallos de conexión a la API
2. **API Errors**: Respuestas de error de la API (404, 500, etc.)
3. **Missing Data**: Datos faltantes o malformados
4. **Timeout Errors**: Errores de timeout en las peticiones HTTP

---

## Fallbacks

### Estrategia de Fallback
- Si el endpoint no devuelve resultados con el equipo asignado al usuario, se utiliza por defecto el equipo `unionyjusticia1`
- Si `unionyjusticia1` tampoco devuelve resultados, se retorna un error 404

---

## Configuración de Headers

### Headers HTTP Utilizados
```python
headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
}
```

### Timeout y Retry
- **Timeout**: Configurado en el cliente HTTP (httpx/aiohttp)
- **Retry**: No implementado por defecto
- **Cache**: No se cachea, siempre se consulta la API

---

## Ejemplos de Uso

### Obtener Datos del Equipo desde el Backend
```python
from app.infrastructure.services.mas10_api_service import Mas10ApiService

mas10_service = Mas10ApiService()
team_data = await mas10_service.get_team_data('unionyjusticia1')
```

### Obtener Datos del Equipo desde el Frontend
```javascript
// Llamar al endpoint del backend
const response = await api.get('/api/v1/mas10/team-data')
const teamData = response.data
```
