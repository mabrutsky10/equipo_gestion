"""
Migration script to create assistants and assistant_functionalities tables
and populate them with initial data.
"""
import asyncio
from sqlalchemy import text
from app.infrastructure.db.session import AsyncSessionLocal


async def migrate_assistants():
    """Create assistants tables and populate with initial data."""
    async with AsyncSessionLocal() as session:
        try:
            # Create assistants table
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS assistants (
                    id VARCHAR(50) PRIMARY KEY,
                    nombre VARCHAR(255) NOT NULL,
                    rol VARCHAR(255) NOT NULL,
                    descripcion TEXT NOT NULL,
                    avatar VARCHAR(500),
                    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
            """))
            
            # Create assistant_functionalities table
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS assistant_functionalities (
                    id SERIAL PRIMARY KEY,
                    assistant_id VARCHAR(50) NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
                    descripcion TEXT NOT NULL,
                    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
            """))
            
            # Create indexes
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_assistants_id ON assistants(id)
            """))
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_assistant_functionalities_assistant_id 
                ON assistant_functionalities(assistant_id)
            """))
            
            # Create function for date_updated if it doesn't exist
            await session.execute(text("""
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.date_updated = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql'
            """))
            
            # Create trigger for date_updated
            await session.execute(text("""
                DROP TRIGGER IF EXISTS update_assistants_updated_at ON assistants
            """))
            await session.execute(text("""
                CREATE TRIGGER update_assistants_updated_at BEFORE UPDATE ON assistants
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
            """))
            
            # Update chat_messages to add foreign key to assistants (only if table exists)
            check_table = await session.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'chat_messages'
                )
            """))
            table_exists = check_table.scalar()
            
            if table_exists:
                await session.execute(text("""
                    ALTER TABLE chat_messages 
                    DROP CONSTRAINT IF EXISTS chat_messages_assistant_id_fkey
                """))
                await session.execute(text("""
                    ALTER TABLE chat_messages 
                    ADD CONSTRAINT chat_messages_assistant_id_fkey 
                    FOREIGN KEY (assistant_id) REFERENCES assistants(id) ON DELETE CASCADE
                """))
            
            # Insert assistants
            await session.execute(text("""
                INSERT INTO assistants (id, nombre, rol, descripcion, avatar) VALUES
                    ('guillote', 'Guillote', 'Manager de jugadores', 
                     'Asiste a cada jugador desde su alta en la plataforma, armando un buen perfil, ayudando a encontrar equipo y maximizando el rendimiento en el mercado de pases.', 
                     '/assets/images/assistants/guillote.png'),
                    ('marta', 'Marta', 'Manager de equipos', 
                     'Asiste a delegados en gestión, comunicación, calendario, competencias y organización general del equipo.', 
                     '/assets/images/assistants/marta.png'),
                    ('kela', 'Kela', 'Periodista deportiva', 
                     'Te ayuda a vos y a tu equipo a tener cobertura y difusión para llegar a tus socios y sponsors.', 
                     '/assets/images/assistants/kela.png'),
                    ('pela', 'Pela', 'Preparador físico', 
                     'Te acompaña a mejorar cada objetivo, con sesiones y planes a la medida de cada jugador del equipo.', 
                     '/assets/images/assistants/pela.png'),
                    ('chori', 'Chori', 'Nutricionista deportivo', 
                     'Se asegura de que tu nutrición sea la adecuada para rendir al máximo.', 
                     '/assets/images/assistants/chori.png')
                ON CONFLICT (id) DO UPDATE SET
                    nombre = EXCLUDED.nombre,
                    rol = EXCLUDED.rol,
                    descripcion = EXCLUDED.descripcion,
                    avatar = EXCLUDED.avatar
            """))
            
            # Insert functionalities
            await session.execute(text("""
                INSERT INTO assistant_functionalities (assistant_id, descripcion) VALUES
                    ('guillote', 'Alta en el mercado de pases, avisos de novedades y oportunidades de fichajes.'),
                    ('guillote', 'Búsqueda y matching de contactos y oportunidades.'),
                    ('guillote', 'Avisos de novedades y nuevas funciones del sistema.'),
                    ('marta', 'Configuración del equipo: jugadores, búsqueda en mercado de pases, competencias y calendario.'),
                    ('marta', 'Gestión y seguimiento del programa de socios y sponsors.'),
                    ('marta', 'Comunicación directa con delegados: recordatorios y avisos organizativos (partidos, torneos, reuniones).'),
                    ('kela', 'Entrevistas y notas deportivas, de perfil y de bienvenida.'),
                    ('kela', 'Placas gráficas de prensa.'),
                    ('kela', 'Novedades de apariciones en medios.'),
                    ('pela', 'Sesiones de entrenamiento personalizadas.'),
                    ('pela', 'Planes adaptados a tu nivel.'),
                    ('pela', 'Galería de ejercicios con tips prácticos.'),
                    ('chori', 'Planes nutricionales personalizados.'),
                    ('chori', 'Consejos de alimentación.'),
                    ('chori', 'Consultas puntuales de nutrición deportiva.')
                ON CONFLICT DO NOTHING
            """))
            
            await session.commit()
            print("✅ Migration completed successfully!")
            print("   - Created assistants table")
            print("   - Created assistant_functionalities table")
            print("   - Inserted 5 assistants with their functionalities")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error during migration: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    asyncio.run(migrate_assistants())

