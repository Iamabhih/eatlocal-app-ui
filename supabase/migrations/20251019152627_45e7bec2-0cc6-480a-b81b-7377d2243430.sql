-- Extend user_role enum to include rider and driver
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'rider';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'driver';