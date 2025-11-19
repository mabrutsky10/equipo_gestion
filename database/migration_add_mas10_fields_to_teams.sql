-- Migration: Add mas10_team_id and mas10_username to teams table
-- Date: 2025-01-XX

-- Add mas10_team_id column
ALTER TABLE teams ADD COLUMN IF NOT EXISTS mas10_team_id INTEGER;

-- Add mas10_username column
ALTER TABLE teams ADD COLUMN IF NOT EXISTS mas10_username VARCHAR(255);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_teams_mas10_team_id ON teams(mas10_team_id);
CREATE INDEX IF NOT EXISTS idx_teams_mas10_username ON teams(mas10_username);

