"""
Script para crear un usuario de ejemplo en la base de datos.
Ejecutar con: python seed_example_user.py
"""
import asyncio
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from app.infrastructure.db.session import AsyncSessionLocal
from app.infrastructure.db.models import UserModel


async def create_example_user():
    """Crea un usuario de ejemplo con credenciales conocidas."""
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Credenciales de ejemplo
    email = "admin@tesorero.com"
    password = "admin123"
    
    async with AsyncSessionLocal() as session:
        try:
            # Verificar si el usuario ya existe
            from sqlalchemy import select
            result = await session.execute(
                select(UserModel).where(UserModel.email == email)
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"⚠️  El usuario {email} ya existe en la base de datos.")
                print(f"   Puedes usar estas credenciales para iniciar sesión:")
                print(f"   Email: {email}")
                print(f"   Password: {password}")
                return
            
            # Hash de la contraseña
            hashed_password = pwd_context.hash(password)
            
            # Crear el usuario
            new_user = UserModel(
                email=email,
                hashed_password=hashed_password,
                is_active=True,
                userprofile_id=None  # Opcional, puede ser None
            )
            
            session.add(new_user)
            await session.commit()
            await session.refresh(new_user)
            
            print("✅ Usuario de ejemplo creado exitosamente!")
            print("\n📋 Credenciales de acceso:")
            print(f"   Email: {email}")
            print(f"   Password: {password}")
            print("\n💡 Puedes usar estas credenciales para iniciar sesión en la aplicación.")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error al crear el usuario: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(create_example_user())

