"""
Script para crear o actualizar el usuario admin en la base de datos.
Ejecutar con: python fix_admin_user.py
"""
import asyncio
import bcrypt
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.db.session import AsyncSessionLocal, engine
from sqlalchemy import text


async def fix_admin_user():
    """Crea o actualiza el usuario admin con la contraseña correcta usando SQL directo."""
    email = "admin@tesorero.com"
    password = "admin123"
    
    # Hash password using bcrypt (same method as LocalAuthProvider)
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
    
    async with AsyncSessionLocal() as session:
        try:
            # Verificar si el usuario ya existe usando SQL directo
            check_result = await session.execute(
                text("SELECT id, email, is_active, team_id FROM users WHERE email = :email"),
                {"email": email}
            )
            existing_user = check_result.fetchone()
            
            if existing_user:
                print(f"📝 Usuario {email} encontrado. Actualizando contraseña...")
                # Actualizar contraseña usando SQL directo
                await session.execute(
                    text("""
                        UPDATE users 
                        SET hashed_password = :hashed_password, 
                            is_active = true
                        WHERE email = :email
                    """),
                    {"hashed_password": hashed_password, "email": email}
                )
                await session.commit()
                print(f"✅ Usuario actualizado exitosamente!")
            else:
                print(f"➕ Creando nuevo usuario {email}...")
                # Crear el usuario usando SQL directo
                await session.execute(
                    text("""
                        INSERT INTO users (email, hashed_password, is_active, userprofile_id, team_id)
                        VALUES (:email, :hashed_password, true, NULL, NULL)
                    """),
                    {"email": email, "hashed_password": hashed_password}
                )
                await session.commit()
                print(f"✅ Usuario creado exitosamente!")
            
            print("\n📋 Credenciales de acceso:")
            print(f"   Email: {email}")
            print(f"   Password: {password}")
            print("\n💡 Puedes usar estas credenciales para iniciar sesión en la aplicación.")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error al crear/actualizar usuario: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    asyncio.run(fix_admin_user())

