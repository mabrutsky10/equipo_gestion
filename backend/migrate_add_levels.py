"""
Script de migración para agregar la tabla levels y la columna level_id a teams.
"""
import asyncio
from app.infrastructure.db.session import AsyncSessionLocal
from sqlalchemy import text

async def migrate_add_levels():
    """Ejecuta la migración para agregar levels y level_id."""
    print("🔧 Ejecutando migración: Agregar tabla levels y columna level_id a teams...\n")
    
    async with AsyncSessionLocal() as session:
        try:
            # 1. Crear tabla levels
            print("1. Creando tabla levels...")
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS levels (
                    id INTEGER PRIMARY KEY,
                    nombre VARCHAR(255) NOT NULL,
                    descripcion TEXT NOT NULL
                );
            """))
            await session.commit()
            print("   ✅ Tabla levels creada")
            
            # 2. Insertar datos en levels
            print("2. Insertando datos en levels...")
            await session.execute(text("""
                INSERT INTO levels (id, nombre, descripcion) VALUES
                    (0, 'Equipo en Configuración', 'Aún NO puede activar socios. Debe completar identidad mínima.'),
                    (1, 'Equipo Amateur Activo', 'Puede activar socios y recibir pagos.'),
                    (2, 'Equipo en Crecimiento', 'Desbloquea agentes iniciales.'),
                    (3, 'Equipo Profesionalizado', 'Desbloquea prensa y visibilidad extendida.'),
                    (4, 'Equipo Embajador', 'Desbloquea comunicación avanzada.'),
                    (5, 'Equipo Pro+', 'Mejora de beneficios económicos.'),
                    (6, 'Equipo Ícono del Fútbol Amateur', 'Máximo nivel.')
                ON CONFLICT (id) DO NOTHING;
            """))
            await session.commit()
            print("   ✅ Datos insertados en levels")
            
            # 3. Agregar columna level_id a teams si no existe
            print("3. Agregando columna level_id a teams...")
            try:
                await session.execute(text("""
                    ALTER TABLE teams 
                    ADD COLUMN IF NOT EXISTS level_id INTEGER DEFAULT 0 NOT NULL;
                """))
                await session.commit()
                print("   ✅ Columna level_id agregada")
            except Exception as e:
                if "already exists" not in str(e).lower() and "duplicate" not in str(e).lower():
                    print(f"   ⚠️  Error al agregar columna: {e}")
                    await session.rollback()
                else:
                    print("   ✅ Columna level_id ya existe")
            
            # 4. Agregar foreign key constraint si no existe
            print("4. Agregando foreign key constraint...")
            try:
                # Primero verificar si la constraint ya existe
                await session.execute(text("""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (
                            SELECT 1 FROM pg_constraint 
                            WHERE conname = 'teams_level_id_fkey'
                        ) THEN
                            ALTER TABLE teams 
                            ADD CONSTRAINT teams_level_id_fkey 
                            FOREIGN KEY (level_id) REFERENCES levels(id);
                        END IF;
                    END $$;
                """))
                await session.commit()
                print("   ✅ Foreign key constraint agregada")
            except Exception as e:
                if "already exists" not in str(e).lower() and "duplicate" not in str(e).lower():
                    print(f"   ⚠️  Error al agregar constraint: {e}")
                    await session.rollback()
                else:
                    print("   ✅ Foreign key constraint ya existe")
            
            # 5. Crear índice si no existe
            print("5. Creando índice en level_id...")
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_teams_level_id ON teams(level_id);
            """))
            await session.commit()
            print("   ✅ Índice creado")
            
            # 6. Actualizar teams existentes que tengan level_id NULL a 0
            print("6. Actualizando teams existentes...")
            await session.execute(text("""
                UPDATE teams SET level_id = 0 WHERE level_id IS NULL;
            """))
            await session.commit()
            print("   ✅ Teams actualizados")
            
            print("\n✅ Migración completada exitosamente!")
            
        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error durante la migración: {e}")
            raise

if __name__ == "__main__":
    asyncio.run(migrate_add_levels())

