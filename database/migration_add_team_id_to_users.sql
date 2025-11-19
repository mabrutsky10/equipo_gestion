-- Migration: Add team_id column to users table
-- This migration adds a team_id foreign key to the users table

-- Add team_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);

-- Update existing user to have team_id = 1
UPDATE users SET team_id = 1 WHERE email = 'admin@tesorero.com' AND team_id IS NULL;

