-- Migration: Payment Methods, Wallet/Credits, and Loyalty Program
-- Created: 2025-11-28

-- ============================================================================
-- SAVED PAYMENT METHODS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN ('visa', 'mastercard', 'amex', 'other')),
  last_four TEXT NOT NULL CHECK (length(last_four) = 4),
  expiry_month INTEGER NOT NULL CHECK (expiry_month >= 1 AND expiry_month <= 12),
  expiry_year INTEGER NOT NULL,
  cardholder_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_saved_payment_methods_user ON saved_payment_methods(user_id);

-- RLS Policies for saved_payment_methods
ALTER TABLE saved_payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment methods"
  ON saved_payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods"
  ON saved_payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods"
  ON saved_payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods"
  ON saved_payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- WALLET/CREDITS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  balance DECIMAL(10, 2) DEFAULT 0 CHECK (balance >= 0),
  currency TEXT DEFAULT 'ZAR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet transactions log
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'promo', 'referral')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  reference_id UUID, -- Can reference orders, refunds, etc.
  reference_type TEXT, -- 'order', 'refund', 'promo_code', 'referral'
  balance_after DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_wallets_user ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON wallet_transactions(created_at DESC);

-- RLS Policies for user_wallets
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON user_wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage wallets"
  ON user_wallets FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for wallet_transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON wallet_transactions FOR SELECT
  USING (
    wallet_id IN (SELECT id FROM user_wallets WHERE user_id = auth.uid())
  );

-- ============================================================================
-- LOYALTY PROGRAM TABLES
-- ============================================================================

-- Loyalty tier configuration
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  min_points INTEGER NOT NULL,
  multiplier DECIMAL(3, 2) DEFAULT 1.0, -- Points multiplier (e.g., 1.5x for gold)
  benefits JSONB DEFAULT '[]', -- Array of benefit descriptions
  badge_color TEXT DEFAULT '#888888',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default tiers
INSERT INTO loyalty_tiers (name, min_points, multiplier, benefits, badge_color) VALUES
  ('Bronze', 0, 1.0, '["Free delivery on first order"]', '#CD7F32'),
  ('Silver', 500, 1.25, '["Free delivery on orders over R100", "Priority support"]', '#C0C0C0'),
  ('Gold', 1500, 1.5, '["Free delivery on all orders", "Priority support", "Exclusive offers"]', '#FFD700'),
  ('Platinum', 5000, 2.0, '["All Gold benefits", "VIP customer service", "Early access to new features", "Birthday reward"]', '#E5E4E2')
ON CONFLICT DO NOTHING;

-- User loyalty points
CREATE TABLE IF NOT EXISTS user_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  current_points INTEGER DEFAULT 0, -- Available to redeem
  tier_id UUID REFERENCES loyalty_tiers(id),
  lifetime_orders INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty points transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_loyalty_id UUID NOT NULL REFERENCES user_loyalty(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'bonus')),
  points INTEGER NOT NULL,
  description TEXT,
  reference_id UUID, -- Order ID or promo ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_loyalty_user ON user_loyalty(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON loyalty_transactions(user_loyalty_id);

-- RLS Policies for loyalty tables
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view loyalty tiers"
  ON loyalty_tiers FOR SELECT
  USING (true);

CREATE POLICY "Users can view own loyalty"
  ON user_loyalty FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage user loyalty"
  ON user_loyalty FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own loyalty transactions"
  ON loyalty_transactions FOR SELECT
  USING (
    user_loyalty_id IN (SELECT id FROM user_loyalty WHERE user_id = auth.uid())
  );

-- ============================================================================
-- ADD SCHEDULED_FOR TO ORDERS TABLE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'scheduled_for'
  ) THEN
    ALTER TABLE orders ADD COLUMN scheduled_for TIMESTAMPTZ;
  END IF;
END $$;

-- Update order status enum to include 'scheduled'
-- This is a comment-only since the status is likely a TEXT field

-- ============================================================================
-- REVIEWS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  food_rating DECIMAL(2, 1) CHECK (food_rating >= 1 AND food_rating <= 5),
  delivery_rating DECIMAL(2, 1) CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  review_text TEXT,
  images TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  response_text TEXT,
  response_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, order_id)
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC);

-- RLS Policies for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to increment helpful count
CREATE OR REPLACE FUNCTION increment_helpful_count(review_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE reviews
  SET helpful_count = helpful_count + 1
  WHERE id = review_id
  RETURNING helpful_count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to create wallet for new user
CREATE OR REPLACE FUNCTION create_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_wallets (user_id, balance)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create loyalty record for new user
CREATE OR REPLACE FUNCTION create_user_loyalty()
RETURNS TRIGGER AS $$
DECLARE
  bronze_tier_id UUID;
BEGIN
  SELECT id INTO bronze_tier_id FROM loyalty_tiers WHERE name = 'Bronze' LIMIT 1;

  INSERT INTO user_loyalty (user_id, total_points, current_points, tier_id)
  VALUES (NEW.id, 0, 0, bronze_tier_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers to auto-create wallet and loyalty for new users
DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_wallet();

DROP TRIGGER IF EXISTS on_auth_user_created_loyalty ON auth.users;
CREATE TRIGGER on_auth_user_created_loyalty
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_loyalty();

-- Function to award loyalty points after order completion
CREATE OR REPLACE FUNCTION award_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
  user_loyalty_rec RECORD;
  points_to_award INTEGER;
  tier_multiplier DECIMAL;
BEGIN
  -- Only process when order changes to delivered
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Calculate base points (1 point per R10 spent)
    points_to_award := FLOOR(NEW.total / 10);

    -- Get user's current tier multiplier
    SELECT ul.*, lt.multiplier INTO user_loyalty_rec
    FROM user_loyalty ul
    LEFT JOIN loyalty_tiers lt ON ul.tier_id = lt.id
    WHERE ul.user_id = NEW.customer_id;

    IF user_loyalty_rec IS NOT NULL THEN
      tier_multiplier := COALESCE(user_loyalty_rec.multiplier, 1.0);
      points_to_award := FLOOR(points_to_award * tier_multiplier);

      -- Update user loyalty
      UPDATE user_loyalty
      SET
        total_points = total_points + points_to_award,
        current_points = current_points + points_to_award,
        lifetime_orders = lifetime_orders + 1,
        updated_at = NOW()
      WHERE user_id = NEW.customer_id;

      -- Log the transaction
      INSERT INTO loyalty_transactions (user_loyalty_id, type, points, description, reference_id)
      VALUES (user_loyalty_rec.id, 'earn', points_to_award, 'Points earned from order', NEW.id);

      -- Check for tier upgrade
      PERFORM update_loyalty_tier(NEW.customer_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update loyalty tier based on total points
CREATE OR REPLACE FUNCTION update_loyalty_tier(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  user_points INTEGER;
  new_tier_id UUID;
BEGIN
  SELECT total_points INTO user_points
  FROM user_loyalty
  WHERE user_id = p_user_id;

  SELECT id INTO new_tier_id
  FROM loyalty_tiers
  WHERE min_points <= user_points
  ORDER BY min_points DESC
  LIMIT 1;

  UPDATE user_loyalty
  SET tier_id = new_tier_id, updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for awarding loyalty points
DROP TRIGGER IF EXISTS on_order_delivered_loyalty ON orders;
CREATE TRIGGER on_order_delivered_loyalty
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION award_loyalty_points();

COMMENT ON TABLE saved_payment_methods IS 'Stored payment methods for faster checkout';
COMMENT ON TABLE user_wallets IS 'User wallet balances for credits, refunds, and promotions';
COMMENT ON TABLE wallet_transactions IS 'Transaction history for user wallets';
COMMENT ON TABLE loyalty_tiers IS 'Loyalty program tier definitions';
COMMENT ON TABLE user_loyalty IS 'User loyalty program status and points';
COMMENT ON TABLE loyalty_transactions IS 'Loyalty points transaction history';
