-- Migration: Create 'wallets' view for backward compatibility
-- Date: 2025-12-25
-- Purpose: useAchievements.ts references 'wallets' table but migration created 'user_wallets'
--          This view ensures both naming conventions work correctly

-- ============================================================================
-- WALLETS VIEW (Points to user_wallets table)
-- ============================================================================

-- Create a view named 'wallets' that mirrors 'user_wallets'
-- This ensures backward compatibility for code that references 'wallets'
CREATE OR REPLACE VIEW wallets AS
SELECT * FROM user_wallets;

-- Grant permissions on the view
GRANT SELECT, INSERT, UPDATE, DELETE ON wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON wallets TO service_role;

-- Add comment explaining the view
COMMENT ON VIEW wallets IS 'Compatibility view for user_wallets table. Use user_wallets in new code.';

-- Enable RLS on the view (inherits from user_wallets)
-- Note: Views automatically inherit RLS policies from underlying tables
