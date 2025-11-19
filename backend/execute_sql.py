"""
Script para ejecutar el archivo SQL de carga de datos de prueba.
"""
import asyncio
from pathlib import Path
from app.infrastructure.db.session import AsyncSessionLocal
from sqlalchemy import text

async def execute_sql_file():
    # Leer el archivo SQL desde el directorio raíz
    sql_file = Path(__file__).parent.parent / 'carga_datos_prueba.sql'
    
    if not sql_file.exists():
        print(f"❌ Archivo no encontrado: {sql_file}")
        return
    
    sql_content = sql_file.read_text()
    
    # Dividir en statements
    statements = []
    current = []
    for line in sql_content.split('\n'):
        line = line.strip()
        if not line or line.startswith('--'):
            continue
        current.append(line)
        if line.endswith(';'):
            stmt = ' '.join(current)
            if stmt.strip() and stmt.strip() != ';':
                statements.append(stmt)
            current = []
    
    if current:
        stmt = ' '.join(current)
        if stmt.strip():
            statements.append(stmt)
    
    print(f'📋 Ejecutando {len(statements)} statements SQL...\n')
    
    async with AsyncSessionLocal() as session:
        executed = 0
        errors = 0
        for i, stmt in enumerate(statements, 1):
            try:
                await session.execute(text(stmt))
                executed += 1
                if i % 10 == 0:
                    print(f'   Procesados {i}/{len(statements)} statements...')
            except Exception as e:
                errors += 1
                error_msg = str(e)
                if 'already exists' not in error_msg.lower() and 'duplicate' not in error_msg.lower():
                    if errors <= 5:  # Mostrar solo los primeros 5 errores
                        print(f'   ⚠️  Error en statement {i}: {error_msg[:100]}')
        
        await session.commit()
        print(f'\n✅ Script ejecutado exitosamente!')
        print(f'   {executed} statements ejecutados')
        if errors > 0:
            print(f'   {errors} errores (algunos pueden ser esperados)')

if __name__ == "__main__":
    asyncio.run(execute_sql_file())

