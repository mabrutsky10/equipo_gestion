-- Adds new fields required for the public socios landing experience

ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS tournament_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS team_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS mercado_pago_link VARCHAR(500),
    ADD COLUMN IF NOT EXISTS raffle_prizes JSON,
    ADD COLUMN IF NOT EXISTS landing_slug VARCHAR(255);

-- Populate landing_slug for existing rows to keep the field unique per team
UPDATE campaigns
SET landing_slug = CONCAT('equipo-', team_id)
WHERE landing_slug IS NULL;

-- Ensure uniqueness when a slug is provided
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'uq_campaigns_landing_slug'
    ) THEN
        CREATE UNIQUE INDEX uq_campaigns_landing_slug
            ON campaigns(landing_slug)
            WHERE landing_slug IS NOT NULL;
    END IF;
END$$;

