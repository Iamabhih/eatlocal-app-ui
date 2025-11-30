-- Phase 4: Innovation Features
-- AI Recommendations, Social Features, Enterprise Dashboard

-- ============================================
-- AI RECOMMENDATIONS SYSTEM
-- ============================================

-- User taste profile (learned from orders and ratings)
CREATE TABLE IF NOT EXISTS user_taste_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  cuisine_preferences JSONB DEFAULT '{}', -- { "italian": 0.8, "indian": 0.6, ... }
  dietary_restrictions TEXT[] DEFAULT '{}',
  spice_tolerance INTEGER DEFAULT 5 CHECK (spice_tolerance BETWEEN 1 AND 10),
  price_preference TEXT DEFAULT 'moderate' CHECK (price_preference IN ('budget', 'moderate', 'premium', 'any')),
  favorite_ingredients TEXT[] DEFAULT '{}',
  disliked_ingredients TEXT[] DEFAULT '{}',
  meal_time_preferences JSONB DEFAULT '{}', -- { "breakfast": ["07:00-10:00"], "lunch": ["12:00-14:00"], ... }
  order_history_vector VECTOR(128), -- For ML-based recommendations (if using pgvector)
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recommendation events for analytics
CREATE TABLE IF NOT EXISTS recommendation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL, -- 'personalized', 'trending', 'similar', 'reorder'
  recommended_items UUID[] NOT NULL, -- Array of menu_item_ids
  context JSONB DEFAULT '{}', -- { "time_of_day": "lunch", "weather": "sunny", ... }
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0, -- Added to cart
  orders INTEGER DEFAULT 0, -- Actually ordered
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurant similarity matrix (precomputed)
CREATE TABLE IF NOT EXISTS restaurant_similarities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  similar_restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score BETWEEN 0 AND 1),
  similarity_factors JSONB DEFAULT '{}', -- { "cuisine": 0.9, "price_range": 0.8, "ratings": 0.7 }
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, similar_restaurant_id)
);

-- Menu item similarities
CREATE TABLE IF NOT EXISTS menu_item_similarities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  similar_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score BETWEEN 0 AND 1),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id, similar_item_id)
);

-- Trending items cache (updated periodically)
CREATE TABLE IF NOT EXISTS trending_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  region TEXT DEFAULT 'all',
  trend_score DECIMAL(10,4) NOT NULL,
  order_count_24h INTEGER DEFAULT 0,
  order_count_7d INTEGER DEFAULT 0,
  growth_rate DECIMAL(5,2) DEFAULT 0, -- Percentage growth
  rank_position INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL FEATURES
-- ============================================

-- Food stories (like Instagram stories for food)
CREATE TABLE IF NOT EXISTS food_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  story_type TEXT NOT NULL CHECK (story_type IN ('photo', 'video', 'text', 'review')),
  media_url TEXT,
  media_storage_path TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  location_name TEXT,
  tags TEXT[] DEFAULT '{}',
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  is_highlight BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story views
CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES food_stories(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0,
  UNIQUE(story_id, viewer_id)
);

-- Story likes
CREATE TABLE IF NOT EXISTS story_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES food_stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'love', 'yummy', 'fire')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- Story comments
CREATE TABLE IF NOT EXISTS story_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES food_stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES story_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 500),
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User follows
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Food collections (like Pinterest boards)
CREATE TABLE IF NOT EXISTS food_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection items
CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES food_collections(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(collection_id, menu_item_id)
);

-- ============================================
-- ENTERPRISE FEATURES
-- ============================================

-- Corporate accounts
CREATE TABLE IF NOT EXISTS corporate_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  company_size TEXT CHECK (company_size IN ('small', 'medium', 'large', 'enterprise')),
  industry TEXT,
  billing_email TEXT NOT NULL,
  billing_address JSONB,
  tax_number TEXT,
  logo_url TEXT,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  monthly_budget DECIMAL(12,2),
  per_order_limit DECIMAL(10,2),
  allowed_restaurants UUID[] DEFAULT '{}', -- Empty = all allowed
  blocked_restaurants UUID[] DEFAULT '{}',
  meal_allowance_type TEXT DEFAULT 'per_day' CHECK (meal_allowance_type IN ('per_day', 'per_week', 'per_month')),
  meal_allowance_amount DECIMAL(10,2) DEFAULT 150,
  require_approval_above DECIMAL(10,2), -- Orders above this need approval
  approval_workflow JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Corporate employees
CREATE TABLE IF NOT EXISTS corporate_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporate_id UUID REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT, -- Company employee ID
  department TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin', 'finance')),
  cost_center TEXT,
  monthly_spent DECIMAL(10,2) DEFAULT 0,
  remaining_allowance DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(corporate_id, user_id)
);

-- Corporate orders (links orders to corporate accounts)
CREATE TABLE IF NOT EXISTS corporate_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  corporate_id UUID REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES corporate_employees(id) ON DELETE SET NULL,
  department TEXT,
  cost_center TEXT,
  approval_status TEXT DEFAULT 'auto_approved' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  expense_category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Corporate billing
CREATE TABLE IF NOT EXISTS corporate_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporate_id UUID REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  service_fees DECIMAL(10,2) DEFAULT 0,
  delivery_fees DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  order_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_reference TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys for enterprise integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporate_id UUID REFERENCES corporate_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  key_hash TEXT NOT NULL, -- SHA-256 hash of the full key
  permissions TEXT[] DEFAULT '{read}',
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,
  last_used_at TIMESTAMPTZ,
  request_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API request logs
CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  corporate_id UUID REFERENCES corporate_accounts(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  request_body JSONB,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DEMAND FORECASTING
-- ============================================

-- Historical demand data
CREATE TABLE IF NOT EXISTS demand_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  hour INTEGER CHECK (hour BETWEEN 0 AND 23),
  order_count INTEGER DEFAULT 0,
  total_quantity INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  day_of_week INTEGER, -- 0-6
  is_holiday BOOLEAN DEFAULT FALSE,
  weather_condition TEXT,
  temperature DECIMAL(4,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demand forecasts
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  hour INTEGER CHECK (hour BETWEEN 0 AND 23),
  predicted_orders INTEGER,
  predicted_revenue DECIMAL(10,2),
  confidence_level DECIMAL(3,2), -- 0.00 to 1.00
  model_version TEXT,
  factors JSONB DEFAULT '{}', -- Factors that influenced prediction
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHATBOT SUPPORT
-- ============================================

-- Chat sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_type TEXT DEFAULT 'support' CHECK (session_type IN ('support', 'order', 'recommendation')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'escalated')),
  escalated_to TEXT, -- Human agent ID if escalated
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  resolution_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'bot', 'agent')),
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'quick_reply', 'card', 'action')),
  metadata JSONB DEFAULT '{}', -- For rich content like buttons, cards
  intent_detected TEXT, -- NLP intent
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ entries for chatbot
CREATE TABLE IF NOT EXISTS faq_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE user_taste_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- User taste profiles
CREATE POLICY "Users can view own taste profile"
  ON user_taste_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own taste profile"
  ON user_taste_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own taste profile"
  ON user_taste_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Food stories
CREATE POLICY "Public stories are viewable by all"
  ON food_stories FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can create own stories"
  ON food_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories"
  ON food_stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON food_stories FOR DELETE
  USING (auth.uid() = user_id);

-- Story interactions
CREATE POLICY "Anyone can view story views count"
  ON story_views FOR SELECT
  USING (true);

CREATE POLICY "Users can record their views"
  ON story_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Anyone can view likes"
  ON story_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like stories"
  ON story_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike stories"
  ON story_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view comments"
  ON story_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can comment"
  ON story_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can edit own comments"
  ON story_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- User follows
CREATE POLICY "Users can view follows"
  ON user_follows FOR SELECT
  USING (auth.uid() IN (follower_id, following_id));

CREATE POLICY "Users can follow others"
  ON user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Collections
CREATE POLICY "Public collections viewable by all"
  ON food_collections FOR SELECT
  USING (visibility = 'public' OR auth.uid() = user_id);

CREATE POLICY "Users can create collections"
  ON food_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections"
  ON food_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections"
  ON food_collections FOR DELETE
  USING (auth.uid() = user_id);

-- Collection items
CREATE POLICY "View items in accessible collections"
  ON collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM food_collections
      WHERE id = collection_id
      AND (visibility = 'public' OR user_id = auth.uid())
    )
  );

CREATE POLICY "Add items to own collections"
  ON collection_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM food_collections
      WHERE id = collection_id AND user_id = auth.uid()
    )
  );

-- Corporate employees
CREATE POLICY "Employees can view own corporate membership"
  ON corporate_employees FOR SELECT
  USING (auth.uid() = user_id);

-- Corporate orders
CREATE POLICY "Employees can view own corporate orders"
  ON corporate_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM corporate_employees
      WHERE id = employee_id AND user_id = auth.uid()
    )
  );

-- Chat sessions
CREATE POLICY "Users can view own chat sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Chat messages
CREATE POLICY "Users can view messages in own sessions"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in own sessions"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_taste_profiles_user ON user_taste_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_events_user ON recommendation_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trending_items_score ON trending_items(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_items_region ON trending_items(region, rank_position);
CREATE INDEX IF NOT EXISTS idx_food_stories_user ON food_stories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_stories_restaurant ON food_stories(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_stories_visibility ON food_stories(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_story ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_food_collections_user ON food_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_corporate_employees_corporate ON corporate_employees(corporate_id);
CREATE INDEX IF NOT EXISTS idx_corporate_employees_user ON corporate_employees(user_id);
CREATE INDEX IF NOT EXISTS idx_corporate_orders_corporate ON corporate_orders(corporate_id);
CREATE INDEX IF NOT EXISTS idx_demand_history_restaurant ON demand_history(restaurant_id, date);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get personalized recommendations for a user
CREATE OR REPLACE FUNCTION get_personalized_recommendations(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  menu_item_id UUID,
  restaurant_id UUID,
  name TEXT,
  price DECIMAL,
  image_url TEXT,
  restaurant_name TEXT,
  match_score DECIMAL,
  recommendation_reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_taste_profile user_taste_profiles%ROWTYPE;
  v_has_orders BOOLEAN;
BEGIN
  -- Get user's taste profile
  SELECT * INTO v_taste_profile
  FROM user_taste_profiles
  WHERE user_id = p_user_id;

  -- Check if user has order history
  SELECT EXISTS(
    SELECT 1 FROM orders WHERE customer_id = p_user_id
  ) INTO v_has_orders;

  -- Return recommendations based on different strategies
  IF v_has_orders THEN
    -- For users with history: combine reorder suggestions with similar items
    RETURN QUERY
    WITH user_favorites AS (
      SELECT
        oi.menu_item_id,
        COUNT(*) as order_count,
        MAX(o.created_at) as last_ordered
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = p_user_id
      GROUP BY oi.menu_item_id
      ORDER BY order_count DESC, last_ordered DESC
      LIMIT 5
    ),
    similar_items AS (
      SELECT
        mis.similar_item_id as menu_item_id,
        mis.similarity_score
      FROM user_favorites uf
      JOIN menu_item_similarities mis ON uf.menu_item_id = mis.menu_item_id
      WHERE mis.similar_item_id NOT IN (SELECT menu_item_id FROM user_favorites)
      ORDER BY mis.similarity_score DESC
      LIMIT p_limit
    )
    SELECT
      mi.id as menu_item_id,
      mi.restaurant_id,
      mi.name,
      mi.price,
      mi.image_url,
      r.name as restaurant_name,
      COALESCE(si.similarity_score, 0.5)::DECIMAL as match_score,
      CASE
        WHEN uf.menu_item_id IS NOT NULL THEN 'You ordered this before'
        ELSE 'Similar to your favorites'
      END as recommendation_reason
    FROM menu_items mi
    JOIN restaurants r ON mi.restaurant_id = r.id
    LEFT JOIN user_favorites uf ON mi.id = uf.menu_item_id
    LEFT JOIN similar_items si ON mi.id = si.menu_item_id
    WHERE mi.is_available = true
    AND (uf.menu_item_id IS NOT NULL OR si.menu_item_id IS NOT NULL)
    ORDER BY
      CASE WHEN uf.menu_item_id IS NOT NULL THEN 1 ELSE 2 END,
      match_score DESC
    LIMIT p_limit;
  ELSE
    -- For new users: return trending items
    RETURN QUERY
    SELECT
      mi.id as menu_item_id,
      mi.restaurant_id,
      mi.name,
      mi.price,
      mi.image_url,
      r.name as restaurant_name,
      ti.trend_score::DECIMAL / 100 as match_score,
      'Trending in your area'::TEXT as recommendation_reason
    FROM trending_items ti
    JOIN menu_items mi ON ti.menu_item_id = mi.id
    JOIN restaurants r ON mi.restaurant_id = r.id
    WHERE mi.is_available = true
    ORDER BY ti.rank_position
    LIMIT p_limit;
  END IF;
END;
$$;

-- Update user taste profile based on order
CREATE OR REPLACE FUNCTION update_taste_profile_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cuisine TEXT;
  v_current_prefs JSONB;
BEGIN
  -- Get restaurant cuisine
  SELECT cuisine_type INTO v_cuisine
  FROM restaurants
  WHERE id = NEW.restaurant_id;

  -- Get or create taste profile
  INSERT INTO user_taste_profiles (user_id)
  VALUES (NEW.customer_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update cuisine preferences
  SELECT cuisine_preferences INTO v_current_prefs
  FROM user_taste_profiles
  WHERE user_id = NEW.customer_id;

  IF v_cuisine IS NOT NULL THEN
    v_current_prefs := COALESCE(v_current_prefs, '{}'::JSONB);
    v_current_prefs := jsonb_set(
      v_current_prefs,
      ARRAY[v_cuisine],
      to_jsonb(COALESCE((v_current_prefs->>v_cuisine)::DECIMAL, 0) + 0.1)
    );

    UPDATE user_taste_profiles
    SET
      cuisine_preferences = v_current_prefs,
      last_updated = NOW()
    WHERE user_id = NEW.customer_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to update taste profile
DROP TRIGGER IF EXISTS trigger_update_taste_profile ON orders;
CREATE TRIGGER trigger_update_taste_profile
  AFTER INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION update_taste_profile_on_order();

-- Get user's feed (stories from followed users and nearby)
CREATE OR REPLACE FUNCTION get_user_feed(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  story_id UUID,
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  story_type TEXT,
  media_url TEXT,
  caption TEXT,
  restaurant_name TEXT,
  menu_item_name TEXT,
  like_count INTEGER,
  comment_count INTEGER,
  has_liked BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fs.id as story_id,
    fs.user_id,
    p.full_name as user_name,
    p.avatar_url as user_avatar,
    fs.story_type,
    fs.media_url,
    fs.caption,
    r.name as restaurant_name,
    mi.name as menu_item_name,
    fs.like_count,
    fs.comment_count,
    EXISTS(
      SELECT 1 FROM story_likes sl
      WHERE sl.story_id = fs.id AND sl.user_id = p_user_id
    ) as has_liked,
    fs.created_at
  FROM food_stories fs
  JOIN profiles p ON fs.user_id = p.id
  LEFT JOIN restaurants r ON fs.restaurant_id = r.id
  LEFT JOIN menu_items mi ON fs.menu_item_id = mi.id
  WHERE (
    -- Stories from followed users
    fs.user_id IN (
      SELECT following_id FROM user_follows
      WHERE follower_id = p_user_id AND status = 'active'
    )
    -- Or public stories
    OR fs.visibility = 'public'
  )
  AND fs.expires_at > NOW()
  ORDER BY fs.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Insert sample FAQ entries
INSERT INTO faq_entries (category, question, answer, keywords) VALUES
('orders', 'How do I track my order?', 'You can track your order in real-time by going to the Orders tab and selecting your active order. You''ll see the driver''s location and estimated arrival time.', ARRAY['track', 'order', 'delivery', 'where', 'status']),
('orders', 'Can I cancel my order?', 'You can cancel your order within 2 minutes of placing it for a full refund. After the restaurant starts preparing, cancellation may incur a partial charge.', ARRAY['cancel', 'refund', 'stop', 'abort']),
('orders', 'How long does delivery take?', 'Delivery times vary based on restaurant preparation time and distance. Typically, orders arrive within 30-45 minutes. You can see the estimated time before placing your order.', ARRAY['time', 'long', 'delivery', 'wait', 'minutes']),
('payment', 'What payment methods do you accept?', 'We accept all major credit and debit cards, as well as EFT payments through PayFast. You can also use your EatLocal wallet balance.', ARRAY['pay', 'payment', 'card', 'credit', 'debit', 'eft']),
('payment', 'How do I add a promo code?', 'You can add a promo code at checkout. Look for the "Add Promo Code" field and enter your code. The discount will be applied automatically.', ARRAY['promo', 'code', 'discount', 'coupon', 'voucher']),
('account', 'How do I change my address?', 'Go to your Profile, then select "Addresses". You can add, edit, or delete delivery addresses from there.', ARRAY['address', 'change', 'edit', 'location', 'delivery']),
('account', 'How do I reset my password?', 'On the login page, click "Forgot Password". Enter your email and we''ll send you a link to reset your password.', ARRAY['password', 'reset', 'forgot', 'login', 'can''t']),
('support', 'My order is wrong. What do I do?', 'We''re sorry about that! Please report the issue through the app by going to your order and selecting "Report Issue". Our team will review and process a refund if applicable.', ARRAY['wrong', 'order', 'mistake', 'incorrect', 'problem', 'issue']),
('support', 'How do I contact support?', 'You can reach our support team through the in-app chat, by emailing support@eatlocal.co.za, or by calling our hotline at 0800-EAT-LOCAL.', ARRAY['contact', 'support', 'help', 'phone', 'email', 'chat'])
ON CONFLICT DO NOTHING;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_personalized_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_feed TO authenticated;
