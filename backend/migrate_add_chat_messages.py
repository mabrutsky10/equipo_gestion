"""
Migration script to create chat_messages table for assistant conversations.
"""
import asyncio
from sqlalchemy import text
from app.infrastructure.db.session import AsyncSessionLocal


async def migrate_chat_messages():
    """Create chat_messages table with proper structure matching the SQLAlchemy model."""
    async with AsyncSessionLocal() as session:
        try:
            # Check if table already exists
            check_table = await session.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'chat_messages'
                )
            """))
            table_exists = check_table.scalar()
            
            if table_exists:
                print("ℹ️  Table chat_messages already exists, skipping creation.")
                return
            
            # Create chat_messages table matching the SQLAlchemy model
            await session.execute(text("""
                CREATE TABLE chat_messages (
                    id SERIAL PRIMARY KEY,
                    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    assistant_id VARCHAR(50) NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    sender VARCHAR(50) NOT NULL CHECK (sender IN ('user', 'assistant')),
                    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
            """))
            
            # Create indexes for performance
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_chat_messages_team_id ON chat_messages(team_id)
            """))
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id)
            """))
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_chat_messages_assistant_id ON chat_messages(assistant_id)
            """))
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender)
            """))
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp)
            """))
            
            # Create function for updated_at if it doesn't exist
            await session.execute(text("""
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql'
            """))
            
            # Create trigger for updated_at
            await session.execute(text("""
                DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages
            """))
            await session.execute(text("""
                CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
            """))
            
            await session.commit()
            print("✅ Migration completed successfully!")
            print("   - Created chat_messages table")
            print("   - Created indexes for performance")
            print("   - Created trigger for updated_at")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Error during migration: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    asyncio.run(migrate_chat_messages())

