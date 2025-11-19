"""
Script para listar todos los usuarios del sistema.
Uso: python list_users.py
"""
import asyncio
from app.infrastructure.db.session import AsyncSessionLocal
from sqlalchemy import text

async def list_users():
    """Lista todos los usuarios del sistema."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(text('''
            SELECT id, email, is_active, userprofile_id, team_id
            FROM users
            ORDER BY id
        '''))
        users = result.fetchall()
        
        if not users:
            print('⚠️  No hay usuarios en el sistema')
            return
        
        print('👥 Usuarios del sistema:\n')
        print(f"{'ID':<5} {'Email':<40} {'Activo':<10} {'Team ID':<10} {'UserProfile ID':<15}")
        print('-' * 80)
        for user in users:
            user_id, email, is_active, userprofile_id, team_id = user
            active_str = '✅ Sí' if is_active else '❌ No'
            team_str = str(team_id) if team_id else '❌ N/A'
            profile_str = str(userprofile_id) if userprofile_id else 'N/A'
            print(f"{user_id:<5} {email:<40} {active_str:<10} {team_str:<10} {profile_str:<15}")
        
        print(f'\n📊 Total: {len(users)} usuario(s)')

if __name__ == "__main__":
    asyncio.run(list_users())

