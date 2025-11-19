"""
Script de migración para agregar la columna socios_desde a la tabla levels.
"""
import asyncio
from app.infrastructure.db.session import AsyncSessionLocal
from sqlalchemy import text

async def migrate_add_socios_desde():
    """Ejecuta la migración para agregar socios_desde a levels."""
    print("🔧 Ejecutando migración: Agregar columna socios_desde a levels...\n")
    
    async with AsyncSessionLocal() as session:
        try:
            # 1. Agregar columna socios_desde si no existe
            print("1. Agregando columna socios_desde a levels...")
            await session.execute(text("""
                ALTER TABLE levels 
                ADD COLUMN IF NOT EXISTS socios_desde INTEGER DEFAULT 0;
            """))
            await session.commit()
            print("   ✅ Columna socios_desde agregada")
            
            # 2. Actualizar valores según el mapeo especificado
            print("2. Actualizando valores de socios_desde...")
            updates = [
                (0, 0),
                (1, 0),
                (2, 11),
                (3, 30),
                (4, 60),
                (5, 101),
                (6, 250),
            ]
            
            for level_id, socios_desde in updates:
                await session.execute(text("""
                    UPDATE levels 
                    SET socios_desde = :socios_desde 
                    WHERE id = :level_id
                """), {"socios_desde": socios_desde, "level_id": level_id})
                print(f"   ✅ Nivel {level_id}: socios_desde = {socios_desde}")
            
            await session.commit()
            print("\n✅ Migración completada exitosamente")
            
        except Exception as e:
            print(f"\n❌ Error en la migración: {e}")
            await session.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(migrate_add_socios_desde())


