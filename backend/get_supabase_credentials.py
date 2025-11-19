"""
Script para obtener las credenciales de Supabase usando el access token.
"""
import os
import requests
import json
from pathlib import Path

SUPABASE_ACCESS_TOKEN = "sbp_8d3a373bc90f656bfca60c36d77404f1ab800d08"
PROJECT_REF = "zudcgdvlootegktfgynn"

def get_project_info():
    """Obtiene la información del proyecto desde la API de Supabase."""
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error al obtener información del proyecto: {e}")
        return None

def get_database_password():
    """Obtiene la contraseña de la base de datos del proyecto."""
    url = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/password"
    headers = {
        "Authorization": f"Bearer {SUPABASE_ACCESS_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            return data.get("database_password")
        else:
            print(f"No se pudo obtener la contraseña automáticamente (status: {response.status_code})")
            print("Necesitarás proporcionarla manualmente desde el dashboard de Supabase")
            return None
    except Exception as e:
        print(f"Error al obtener contraseña: {e}")
        return None

def update_env_file(project_info, db_password=None):
    """Actualiza el archivo .env con las credenciales."""
    # Construir las credenciales basadas en el project_ref
    db_host = f"db.{PROJECT_REF}.supabase.co"
    db_port = "5432"
    db_user = "postgres"
    db_name = "postgres"
    
    # Si no tenemos la contraseña, pedirla al usuario
    if not db_password:
        print("\n⚠️  No se pudo obtener la contraseña automáticamente.")
        print("   Puedes encontrarla en: https://supabase.com/dashboard/project/zudcgdvlootegktfgynn/settings/database")
        db_password = input("🔑 Ingresa la contraseña de la base de datos: ").strip()
    
    credentials = {
        "DB_HOST": db_host,
        "DB_PORT": db_port,
        "DB_USER": db_user,
        "DB_PASSWORD": db_password,
        "DB_NAME": db_name,
    }
    
    env_path = Path(__file__).parent / ".env"
    
    # Leer el archivo .env actual
    env_content = ""
    if env_path.exists():
        env_content = env_path.read_text()
    
    # Actualizar o agregar las credenciales
    lines = env_content.split("\n")
    updated_lines = []
    credentials_added = {key: False for key in credentials.keys()}
    
    for line in lines:
        updated = False
        for key, value in credentials.items():
            if line.startswith(f"{key}="):
                updated_lines.append(f"{key}={value}")
                credentials_added[key] = True
                updated = True
                break
        if not updated:
            if line.strip():  # Mantener líneas no vacías
                updated_lines.append(line)
    
    # Agregar credenciales que no existían
    for key, value in credentials.items():
        if not credentials_added[key]:
            updated_lines.append(f"{key}={value}")
    
    # Escribir el archivo actualizado
    env_path.write_text("\n".join(updated_lines))
    return env_path, credentials

def main():
    print("🔍 Obteniendo información del proyecto Supabase...\n")
    
    project_info = get_project_info()
    if project_info:
        print(f"✅ Proyecto encontrado: {project_info.get('name', 'tesorero')}")
        print(f"   Region: {project_info.get('region', 'N/A')}")
    
    print("\n🔑 Obteniendo contraseña de la base de datos...")
    db_password = get_database_password()
    
    env_path, credentials = update_env_file(project_info, db_password)
    
    print(f"\n✅ Archivo .env actualizado en: {env_path}")
    print("\n📋 Credenciales configuradas:")
    print(f"   Host: {credentials['DB_HOST']}")
    print(f"   Port: {credentials['DB_PORT']}")
    print(f"   User: {credentials['DB_USER']}")
    print(f"   Database: {credentials['DB_NAME']}")
    print(f"   Password: {'*' * len(credentials['DB_PASSWORD'])}")
    
    print("\n💡 Próximos pasos:")
    print("   1. Verifica que el schema esté creado en Supabase")
    print("   2. Ejecuta: python seed_example_user.py (para crear usuario de ejemplo)")
    print("   3. Inicia el backend: python main.py")

if __name__ == "__main__":
    main()

