"""
Script para ejecutar la migración que agrega team_id a la tabla users.
"""
import asyncio
from pathlib import Path
from app.infrastructure.db.session import AsyncSessionLocal
from sqlalchemy import text

async def execute_migration():
    # Leer el archivo SQL de migración
    migration_file = Path(__file__).parent.parent / 'database' / 'migration_add_team_id_to_users.sql'
    
    if not migration_file.exists():
        print(f"❌ Archivo de migración no encontrado: {migration_file}")
        return
    
    sql_content = migration_file.read_text()
    
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
    
    print(f'📋 Ejecutando migración: {len(statements)} statements SQL...\n')
    
    async with AsyncSessionLocal() as session:
        executed = 0
        errors = 0
        for i, stmt in enumerate(statements, 1):
            try:
                await session.execute(text(stmt))
                executed += 1
                print(f'   ✅ Statement {i} ejecutado')
            except Exception as e:
                errors += 1
                error_msg = str(e)
                if 'already exists' not in error_msg.lower() and 'duplicate' not in error_msg.lower():
                    print(f'   ⚠️  Error en statement {i}: {error_msg[:100]}')
                else:
                    print(f'   ℹ️  Statement {i}: Ya existe (se omite)')
                    executed += 1
        
        await session.commit()
        print(f'\n✅ Migración ejecutada!')
        print(f'   {executed} statements ejecutados')
        if errors > 0:
            print(f'   {errors} errores (algunos pueden ser esperados)')
        
        # Verificar que el usuario tenga team_id
        result = await session.execute(
            text('SELECT id, email, team_id FROM users WHERE email = :email'),
            {'email': 'admin@tesorero.com'}
        )
        user = result.fetchone()
        if user:
            user_id, email, team_id = user
            print(f'\n👤 Usuario {email}:')
            print(f'   ID: {user_id}')
            print(f'   Team ID: {team_id if team_id else "❌ No asignado"}')
            if not team_id:
                print('   ⚠️  Actualizando usuario para asignar team_id = 1...')
                await session.execute(
                    text('UPDATE users SET team_id = 1 WHERE id = :user_id'),
                    {'user_id': user_id}
                )
                await session.commit()
                print('   ✅ Usuario actualizado con team_id = 1')

if __name__ == "__main__":
    asyncio.run(execute_migration())

