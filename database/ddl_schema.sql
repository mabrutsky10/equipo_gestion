-- Database DDL for Tesorero Project
-- PostgreSQL Schema for Team Management Platform

-- Note: userprofile table already exists, so we reference it

-- Levels table (niveles de equipos)
CREATE TABLE IF NOT EXISTS levels (
    id INTEGER PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    socios_desde INTEGER DEFAULT 0
);

-- Insert default levels
INSERT INTO levels (id, nombre, descripcion, socios_desde) VALUES
    (0, 'Equipo en Configuración', 'Aún NO puede activar socios. Debe completar identidad mínima.', 0),
    (1, 'Equipo Amateur Activo', 'Puede activar socios y recibir pagos.', 0),
    (2, 'Equipo en Crecimiento', 'Desbloquea agentes iniciales.', 11),
    (3, 'Equipo Profesionalizado', 'Desbloquea prensa y visibilidad extendida.', 30),
    (4, 'Equipo Embajador', 'Desbloquea comunicación avanzada.', 60),
    (5, 'Equipo Pro+', 'Mejora de beneficios económicos.', 101),
    (6, 'Equipo Ícono del Fútbol Amateur', 'Máximo nivel.', 250)
ON CONFLICT (id) DO UPDATE SET socios_desde = EXCLUDED.socios_desde;

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    currency_default VARCHAR(10) DEFAULT 'ARS' NOT NULL,
    mas10_team_id INTEGER,
    mas10_username VARCHAR(255),
    level_id INTEGER DEFAULT 0 NOT NULL REFERENCES levels(id),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Members (socios) table
CREATE TABLE IF NOT EXISTS members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    userprofile_id INTEGER REFERENCES userprofile(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive')),
    subscription_link VARCHAR(500),
    subscription_status VARCHAR(50) DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'paused', 'cancelled', 'inactive')),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Sponsors table
CREATE TABLE IF NOT EXISTS sponsors (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    subscription_link VARCHAR(500),
    subscription_status VARCHAR(50) DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'paused', 'cancelled', 'inactive')),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Collectas (fundraising) table
CREATE TABLE IF NOT EXISTS collectas (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true NOT NULL,
    link_public VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_end TIMESTAMP,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Collecta invited members (many-to-many)
CREATE TABLE IF NOT EXISTS collecta_invited_members (
    id SERIAL PRIMARY KEY,
    collecta_id INTEGER NOT NULL REFERENCES collectas(id) ON DELETE CASCADE,
    member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
    external_email VARCHAR(255),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(collecta_id, member_id),
    UNIQUE(collecta_id, external_email)
);

-- Monthly fee configuration
CREATE TABLE IF NOT EXISTS config_cuota (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
    monto DECIMAL(10, 2) NOT NULL,
    moneda VARCHAR(10) DEFAULT 'ARS' NOT NULL,
    provider VARCHAR(50) DEFAULT 'manual' NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Campaigns (member campaigns / Cuota Social Amateur)
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    team_name VARCHAR(255) NOT NULL,
    team_logo TEXT,
    team_bio TEXT,
    monthly_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ARS' NOT NULL,
    alternative_amounts JSONB,
    payment_method VARCHAR(50) DEFAULT 'mercado_pago' NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'inactive')),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_published TIMESTAMP,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Movements (Cuenta Corriente) table
CREATE TABLE IF NOT EXISTS movements (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('cuota', 'colecta', 'aporte', 'sponsor', 'fee', 'cashout')),
    monto_bruto DECIMAL(10, 2) NOT NULL,
    monto_fee DECIMAL(10, 2) DEFAULT 0 NOT NULL,
    monto_neto DECIMAL(10, 2) NOT NULL,
    moneda VARCHAR(10) DEFAULT 'ARS' NOT NULL,
    metodo_pago VARCHAR(50) DEFAULT 'manual' NOT NULL,
    origen_tipo VARCHAR(50) NOT NULL CHECK (origen_tipo IN ('member', 'sponsor', 'collecta', 'manual', 'system')),
    origen_id INTEGER,
    estado VARCHAR(50) DEFAULT 'confirmed' CHECK (estado IN ('confirmed', 'pending', 'cancelled')),
    description TEXT,
    payment_provider VARCHAR(50) DEFAULT 'manual',
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Payment links table (to track payment links for members, sponsors, collectas)
CREATE TABLE IF NOT EXISTS payment_links (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('member', 'sponsor', 'collecta')),
    entity_id INTEGER NOT NULL,
    link_url VARCHAR(500) NOT NULL,
    provider VARCHAR(50) DEFAULT 'manual' NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(entity_type, entity_id, provider)
);

-- Followers table (seguidores del equipo)
CREATE TABLE IF NOT EXISTS followers (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    userprofile_id INTEGER REFERENCES userprofile(id) ON DELETE SET NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    userprofile_id INTEGER REFERENCES userprofile(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    is_active BOOLEAN DEFAULT true NOT NULL,
    team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL
);

-- Assistants table
CREATE TABLE IF NOT EXISTS assistants (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    avatar VARCHAR(500),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Assistant functionalities table
CREATE TABLE IF NOT EXISTS assistant_functionalities (
    id SERIAL PRIMARY KEY,
    assistant_id VARCHAR(50) NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Chat messages table (for assistant conversations)
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assistant_id VARCHAR(50) NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender VARCHAR(50) NOT NULL CHECK (sender IN ('user', 'assistant')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    date_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_level_id ON teams(level_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_members_team_id ON members(team_id);
CREATE INDEX IF NOT EXISTS idx_members_userprofile_id ON members(userprofile_id);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_sponsors_team_id ON sponsors(team_id);
CREATE INDEX IF NOT EXISTS idx_collectas_team_id ON collectas(team_id);
CREATE INDEX IF NOT EXISTS idx_collectas_status ON collectas(status);
CREATE INDEX IF NOT EXISTS idx_collecta_invited_members_collecta_id ON collecta_invited_members(collecta_id);
CREATE INDEX IF NOT EXISTS idx_movements_team_id ON movements(team_id);
CREATE INDEX IF NOT EXISTS idx_movements_fecha ON movements(fecha);
CREATE INDEX IF NOT EXISTS idx_movements_tipo ON movements(tipo);
CREATE INDEX IF NOT EXISTS idx_movements_origen ON movements(origen_tipo, origen_id);
CREATE INDEX IF NOT EXISTS idx_movements_estado ON movements(estado);
CREATE INDEX IF NOT EXISTS idx_payment_links_entity ON payment_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_team_id ON campaigns(team_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_followers_team_id ON followers(team_id);
CREATE INDEX IF NOT EXISTS idx_followers_userprofile_id ON followers(userprofile_id);
CREATE INDEX IF NOT EXISTS idx_followers_status ON followers(status);
CREATE INDEX IF NOT EXISTS idx_assistants_id ON assistants(id);
CREATE INDEX IF NOT EXISTS idx_assistant_functionalities_assistant_id ON assistant_functionalities(assistant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_team_id ON chat_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_assistant_id ON chat_messages(assistant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Function to update date_updated timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for date_updated
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsors_updated_at BEFORE UPDATE ON sponsors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collectas_updated_at BEFORE UPDATE ON collectas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_config_cuota_updated_at BEFORE UPDATE ON config_cuota
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movements_updated_at BEFORE UPDATE ON movements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_links_updated_at BEFORE UPDATE ON payment_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_followers_updated_at BEFORE UPDATE ON followers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assistants_updated_at BEFORE UPDATE ON assistants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default assistants data
INSERT INTO assistants (id, nombre, rol, descripcion, avatar) VALUES
    ('guillote', 'Guillote', 'Manager de jugadores', 'Asiste a cada jugador desde su alta en la plataforma, armando un buen perfil, ayudando a encontrar equipo y maximizando el rendimiento en el mercado de pases.', '/assets/images/assistants/guillote.png'),
    ('marta', 'Marta', 'Manager de equipos', 'Asiste a delegados en gestión, comunicación, calendario, competencias y organización general del equipo.', '/assets/images/assistants/marta.png'),
    ('kela', 'Kela', 'Periodista deportiva', 'Te ayuda a vos y a tu equipo a tener cobertura y difusión para llegar a tus socios y sponsors.', '/assets/images/assistants/kela.png'),
    ('pela', 'Pela', 'Preparador físico', 'Te acompaña a mejorar cada objetivo, con sesiones y planes a la medida de cada jugador del equipo.', '/assets/images/assistants/pela.png'),
    ('chori', 'Chori', 'Nutricionista deportivo', 'Se asegura de que tu nutrición sea la adecuada para rendir al máximo.', '/assets/images/assistants/chori.png')
ON CONFLICT (id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    rol = EXCLUDED.rol,
    descripcion = EXCLUDED.descripcion,
    avatar = EXCLUDED.avatar;

-- Insert default assistant functionalities
INSERT INTO assistant_functionalities (assistant_id, descripcion) VALUES
    -- Guillote functionalities
    ('guillote', 'Alta en el mercado de pases, avisos de novedades y oportunidades de fichajes.'),
    ('guillote', 'Búsqueda y matching de contactos y oportunidades.'),
    ('guillote', 'Avisos de novedades y nuevas funciones del sistema.'),
    -- Marta functionalities
    ('marta', 'Configuración del equipo: jugadores, búsqueda en mercado de pases, competencias y calendario.'),
    ('marta', 'Gestión y seguimiento del programa de socios y sponsors.'),
    ('marta', 'Comunicación directa con delegados: recordatorios y avisos organizativos (partidos, torneos, reuniones).'),
    -- Kela functionalities
    ('kela', 'Entrevistas y notas deportivas, de perfil y de bienvenida.'),
    ('kela', 'Placas gráficas de prensa.'),
    ('kela', 'Novedades de apariciones en medios.'),
    -- Pela functionalities
    ('pela', 'Sesiones de entrenamiento personalizadas.'),
    ('pela', 'Planes adaptados a tu nivel.'),
    ('pela', 'Galería de ejercicios con tips prácticos.'),
    -- Chori functionalities
    ('chori', 'Planes nutricionales personalizados.'),
    ('chori', 'Consejos de alimentación.'),
    ('chori', 'Consultas puntuales de nutrición deportiva.')
ON CONFLICT DO NOTHING;

