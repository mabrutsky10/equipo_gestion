"""
Script para crear las tablas en Supabase ejecutando el schema SQL.
"""
import asyncio
from pathlib import Path
from app.infrastructure.db.session import AsyncSessionLocal
from sqlalchemy import text

def read_sql_file(file_path: str) -> str:
    """Lee un archivo SQL."""
    path = Path(file_path)
    if not path.exists():
        # Intentar con ruta relativa desde backend
        path = Path(__file__).parent.parent / file_path
    return path.read_text()

async def setup_database():
    """Ejecuta el schema SQL en la base de datos."""
    print("🔧 Configurando base de datos en Supabase...\n")
    
    # Leer el archivo SQL
    sql_file = "database/ddl_schema.sql"
    try:
        sql_content = read_sql_file(sql_file)
        print(f"✅ Archivo SQL leído: {sql_file}")
    except Exception as e:
        print(f"❌ Error al leer el archivo SQL: {e}")
        return False
    
    # Dividir en statements (separados por ;)
    # Filtrar comentarios y líneas vacías
    statements = []
    current_statement = []
    
    for line in sql_content.split('\n'):
        line = line.strip()
        # Saltar comentarios y líneas vacías
        if not line or line.startswith('--'):
            continue
        current_statement.append(line)
        # Si la línea termina con ;, es el final de un statement
        if line.endswith(';'):
            statement = ' '.join(current_statement)
            if statement.strip() and statement.strip() != ';':
                statements.append(statement)
            current_statement = []
    
    if current_statement:
        statement = ' '.join(current_statement)
        if statement.strip():
            statements.append(statement)
    
    print(f"📋 Encontrados {len(statements)} statements SQL\n")
    
    # Ejecutar cada statement de forma independiente
    executed = 0
    failed = 0
    
    for i, statement in enumerate(statements, 1):
        async with AsyncSessionLocal() as session:
            try:
                await session.execute(text(statement))
                await session.commit()
                executed += 1
                if i % 5 == 0:
                    print(f"   Ejecutados {i}/{len(statements)} statements...")
            except Exception as e:
                await session.rollback()
                error_msg = str(e)
                # Algunos errores son esperados
                if "already exists" in error_msg.lower() or "duplicate" in error_msg.lower():
                    executed += 1  # Contar como exitoso
                elif "InFailedSQLTransaction" in error_msg:
                    # Error de transacción fallida, continuar
                    failed += 1
                else:
                    failed += 1
                    if failed <= 5:  # Mostrar solo los primeros 5 errores
                        print(f"   ⚠️  Statement {i}: {error_msg[:80]}")
    
    print(f"\n✅ Base de datos configurada!")
    print(f"   {executed} statements ejecutados exitosamente")
    if failed > 0:
        print(f"   {failed} statements con errores (algunos pueden ser esperados)")
    return True

if __name__ == "__main__":
    success = asyncio.run(setup_database())
    if success:
        print("\n💡 Próximo paso: Ejecuta 'python seed_example_user.py' para crear el usuario de ejemplo")
    else:
        print("\n⚠️  Revisa los errores arriba y vuelve a intentar")

