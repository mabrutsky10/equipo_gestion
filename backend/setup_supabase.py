"""
Script para configurar las credenciales de Supabase automáticamente.
Necesitas proporcionar:
- SUPABASE_URL: La URL de tu proyecto (ej: https://xxxxx.supabase.co)
- SUPABASE_SERVICE_ROLE_KEY: La service role key (opcional, para gestión avanzada)
- O usar la CLI: supabase link --project-ref <project-ref>
"""
import os
import sys
from pathlib import Path

def get_supabase_credentials():
    """Obtiene las credenciales de Supabase del usuario."""
    print("🔧 Configuración de Supabase para Tesorero\n")
    print("Necesito la siguiente información de tu proyecto Supabase:")
    print("(Puedes encontrarla en: https://supabase.com/dashboard/project/<tu-proyecto>/settings/database)\n")
    
    # Opción 1: Usar variables de entorno
    supabase_url = os.getenv("SUPABASE_URL")
    db_password = os.getenv("SUPABASE_DB_PASSWORD")
    
    if not supabase_url:
        supabase_url = input("📌 SUPABASE_URL (ej: https://xxxxx.supabase.co): ").strip()
    
    if not db_password:
        db_password = input("🔑 DB Password (la contraseña de la base de datos): ").strip()
    
    # Extraer el host de la URL
    # La URL de Supabase es: https://xxxxx.supabase.co
    # El host de la DB es: db.xxxxx.supabase.co
    if supabase_url.startswith("https://"):
        project_ref = supabase_url.replace("https://", "").replace(".supabase.co", "")
        db_host = f"db.{project_ref}.supabase.co"
    else:
        db_host = input("📡 DB Host (ej: db.xxxxx.supabase.co): ").strip()
    
    # Valores por defecto de Supabase
    db_port = "5432"
    db_user = "postgres"
    db_name = "postgres"
    
    return {
        "DB_HOST": db_host,
        "DB_PORT": db_port,
        "DB_USER": db_user,
        "DB_PASSWORD": db_password,
        "DB_NAME": db_name,
    }

def update_env_file(credentials):
    """Actualiza el archivo .env con las credenciales."""
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
            updated_lines.append(line)
    
    # Agregar credenciales que no existían
    for key, value in credentials.items():
        if not credentials_added[key]:
            updated_lines.append(f"{key}={value}")
    
    # Escribir el archivo actualizado
    env_path.write_text("\n".join(updated_lines))
    print(f"\n✅ Archivo .env actualizado en: {env_path}")
    return env_path

def main():
    try:
        credentials = get_supabase_credentials()
        env_path = update_env_file(credentials)
        
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
        
    except KeyboardInterrupt:
        print("\n\n❌ Configuración cancelada")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

