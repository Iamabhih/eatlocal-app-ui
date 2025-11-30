-- ================================================
-- Phase 3: Feature Enhancement Migration
-- Date: 2025-11-30
-- Features: Group Ordering, Scheduled Orders, Proof of Delivery, Menu Import
-- ================================================

-- ================================================
-- 1. GROUP ORDERING SYSTEM
-- ================================================

-- Group orders (main table)
CREATE TABLE IF NOT EXISTS public.group_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Host info
    host_id UUID NOT NULL REFERENCES auth.users(id),

    -- Restaurant
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),

    -- Group details
    name TEXT NOT NULL DEFAULT 'Group Order',
    description TEXT,

    -- Invite code for others to join
    invite_code TEXT NOT NULL UNIQUE DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)),

    -- Deadline for adding items
    deadline TIMESTAMPTZ NOT NULL,

    -- Delivery details
    delivery_address_id UUID REFERENCES public.addresses(id),
    delivery_address JSONB,

    -- Payment split
    split_type TEXT NOT NULL DEFAULT 'individual' CHECK (split_type IN ('individual', 'host_pays', 'equal_split', 'proportional')),

    -- Status
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'locked', 'ordered', 'delivered', 'cancelled')),

    -- Final order reference
    order_id UUID REFERENCES public.orders(id),

    -- Totals (calculated)
    subtotal DECIMAL(10, 2) DEFAULT 0,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    service_fee DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    ordered_at TIMESTAMPTZ
);

-- Group order participants
CREATE TABLE IF NOT EXISTS public.group_order_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_order_id UUID NOT NULL REFERENCES public.group_orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),

    -- Participant status
    status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('invited', 'joined', 'submitted', 'paid', 'removed')),

    -- Their share
    subtotal DECIMAL(10, 2) DEFAULT 0,
    share_amount DECIMAL(10, 2) DEFAULT 0, -- Their portion including fees

    -- Payment status
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    paid_at TIMESTAMPTZ,

    -- Timestamps
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,

    UNIQUE(group_order_id, user_id)
);

-- Group order items (items added by participants)
CREATE TABLE IF NOT EXISTS public.group_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_order_id UUID NOT NULL REFERENCES public.group_orders(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.group_order_participants(id) ON DELETE CASCADE,

    -- Menu item reference
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id),

    -- Item details (snapshot at time of adding)
    item_name TEXT NOT NULL,
    item_price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),

    -- Customizations
    special_instructions TEXT,
    modifiers JSONB DEFAULT '[]'::jsonb,

    -- Calculated
    total_price DECIMAL(10, 2) NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for group ordering
CREATE INDEX IF NOT EXISTS idx_group_orders_host_id ON public.group_orders(host_id);
CREATE INDEX IF NOT EXISTS idx_group_orders_restaurant_id ON public.group_orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_group_orders_invite_code ON public.group_orders(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_orders_status ON public.group_orders(status);
CREATE INDEX IF NOT EXISTS idx_group_order_participants_group_id ON public.group_order_participants(group_order_id);
CREATE INDEX IF NOT EXISTS idx_group_order_participants_user_id ON public.group_order_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_group_order_items_group_id ON public.group_order_items(group_order_id);
CREATE INDEX IF NOT EXISTS idx_group_order_items_participant_id ON public.group_order_items(participant_id);

-- RLS for group ordering
ALTER TABLE public.group_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_order_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_order_items ENABLE ROW LEVEL SECURITY;

-- Host can manage their group orders
CREATE POLICY "Host manages group orders" ON public.group_orders
    FOR ALL USING (auth.uid() = host_id);

-- Participants can view group orders they're part of
CREATE POLICY "Participants view group orders" ON public.group_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_order_participants
            WHERE group_order_id = group_orders.id AND user_id = auth.uid()
        )
    );

-- Anyone can view open group orders by invite code
CREATE POLICY "View by invite code" ON public.group_orders
    FOR SELECT USING (status = 'open');

-- Participants manage their own participation
CREATE POLICY "Manage own participation" ON public.group_order_participants
    FOR ALL USING (auth.uid() = user_id);

-- Host can manage all participants
CREATE POLICY "Host manages participants" ON public.group_order_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.group_orders
            WHERE id = group_order_participants.group_order_id AND host_id = auth.uid()
        )
    );

-- Participants manage their own items
CREATE POLICY "Manage own items" ON public.group_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.group_order_participants
            WHERE id = group_order_items.participant_id AND user_id = auth.uid()
        )
    );

-- All participants can view group items
CREATE POLICY "View group items" ON public.group_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_order_participants gop
            JOIN public.group_orders go ON go.id = gop.group_order_id
            WHERE gop.user_id = auth.uid() AND go.id = group_order_items.group_order_id
        )
    );

-- ================================================
-- 2. SCHEDULED ORDERS
-- ================================================

-- Add scheduled fields to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduling_reminder_sent BOOLEAN DEFAULT false;

-- Scheduled order reminders tracking
CREATE TABLE IF NOT EXISTS public.scheduled_order_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,

    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h_before', '1h_before', '15min_before', 'ready')),
    scheduled_for TIMESTAMPTZ NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(order_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_order_id ON public.scheduled_order_reminders(order_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_scheduled ON public.scheduled_order_reminders(scheduled_for) WHERE status = 'pending';

-- ================================================
-- 3. PROOF OF DELIVERY
-- ================================================

-- Delivery confirmations
CREATE TABLE IF NOT EXISTS public.delivery_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
    delivery_partner_id UUID NOT NULL REFERENCES auth.users(id),

    -- Confirmation type
    confirmation_type TEXT NOT NULL DEFAULT 'photo' CHECK (confirmation_type IN ('photo', 'signature', 'code', 'contactless')),

    -- Photo evidence
    photo_url TEXT,
    photo_storage_path TEXT,

    -- Signature (if applicable)
    signature_url TEXT,

    -- Verification code (if applicable)
    verification_code TEXT,
    code_verified BOOLEAN DEFAULT false,

    -- GPS coordinates at delivery
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(11, 8),

    -- Distance from delivery address (meters)
    distance_from_address INTEGER,

    -- Recipient info
    recipient_name TEXT,
    recipient_relationship TEXT, -- 'customer', 'family', 'neighbor', 'security', etc.

    -- Notes
    delivery_notes TEXT,

    -- Verification status
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery issues/disputes
CREATE TABLE IF NOT EXISTS public.delivery_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id),
    confirmation_id UUID REFERENCES public.delivery_confirmations(id),

    reported_by UUID NOT NULL REFERENCES auth.users(id),
    reporter_type TEXT NOT NULL CHECK (reporter_type IN ('customer', 'restaurant', 'driver', 'admin')),

    -- Issue details
    issue_type TEXT NOT NULL CHECK (issue_type IN (
        'not_delivered', 'wrong_location', 'damaged', 'missing_items',
        'wrong_order', 'late', 'unprofessional', 'other'
    )),
    description TEXT NOT NULL,

    -- Evidence
    evidence_photos JSONB DEFAULT '[]'::jsonb,

    -- Resolution
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    resolution TEXT,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMPTZ,

    -- Outcome
    outcome TEXT CHECK (outcome IN ('refund_full', 'refund_partial', 'redelivery', 'credit', 'no_action', 'driver_warning', 'driver_suspended')),
    refund_amount DECIMAL(10, 2),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for delivery confirmation
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_order_id ON public.delivery_confirmations(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_confirmations_partner_id ON public.delivery_confirmations(delivery_partner_id);
CREATE INDEX IF NOT EXISTS idx_delivery_issues_order_id ON public.delivery_issues(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_issues_status ON public.delivery_issues(status);

-- RLS for delivery confirmation
ALTER TABLE public.delivery_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_issues ENABLE ROW LEVEL SECURITY;

-- Delivery partners create confirmations
CREATE POLICY "Partners create confirmations" ON public.delivery_confirmations
    FOR INSERT WITH CHECK (auth.uid() = delivery_partner_id);

-- Partners can view their confirmations
CREATE POLICY "Partners view own confirmations" ON public.delivery_confirmations
    FOR SELECT USING (auth.uid() = delivery_partner_id);

-- Customers can view confirmation for their order
CREATE POLICY "Customers view order confirmation" ON public.delivery_confirmations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE id = delivery_confirmations.order_id AND customer_id = auth.uid()
        )
    );

-- Admins manage all confirmations
CREATE POLICY "Admins manage confirmations" ON public.delivery_confirmations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Users can report issues
CREATE POLICY "Users report issues" ON public.delivery_issues
    FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Users view issues they reported
CREATE POLICY "View own issues" ON public.delivery_issues
    FOR SELECT USING (auth.uid() = reported_by);

-- Admins manage all issues
CREATE POLICY "Admins manage issues" ON public.delivery_issues
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- ================================================
-- 4. MENU IMPORT TRACKING
-- ================================================

-- Menu import jobs
CREATE TABLE IF NOT EXISTS public.menu_import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),

    -- File info
    file_name TEXT NOT NULL,
    file_url TEXT,
    file_storage_path TEXT,
    file_type TEXT CHECK (file_type IN ('csv', 'xlsx', 'json')),

    -- Import config
    import_mode TEXT NOT NULL DEFAULT 'merge' CHECK (import_mode IN ('replace', 'merge', 'add_only')),
    category_mapping JSONB DEFAULT '{}'::jsonb,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

    -- Results
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    items_created INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_skipped INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,

    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_import_jobs_restaurant_id ON public.menu_import_jobs(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_import_jobs_status ON public.menu_import_jobs(status);

ALTER TABLE public.menu_import_jobs ENABLE ROW LEVEL SECURITY;

-- Restaurant owners can manage their imports
CREATE POLICY "Restaurant owners manage imports" ON public.menu_import_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.restaurants
            WHERE id = menu_import_jobs.restaurant_id AND owner_id = auth.uid()
        )
    );

-- ================================================
-- 5. ACHIEVEMENT/GAMIFICATION SYSTEM
-- ================================================

-- Achievement definitions
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Achievement info
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,

    -- Category
    category TEXT NOT NULL CHECK (category IN ('orders', 'reviews', 'referrals', 'loyalty', 'explorer', 'social', 'special')),

    -- Requirements
    requirement_type TEXT NOT NULL CHECK (requirement_type IN ('count', 'streak', 'total_spent', 'unique_restaurants', 'rating', 'custom')),
    requirement_value INTEGER NOT NULL,
    requirement_period TEXT, -- 'daily', 'weekly', 'monthly', 'all_time'

    -- Rewards
    reward_type TEXT CHECK (reward_type IN ('points', 'credit', 'badge', 'discount', 'free_delivery')),
    reward_value DECIMAL(10, 2),

    -- Display
    icon TEXT,
    badge_image_url TEXT,
    rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_secret BOOLEAN DEFAULT false, -- Hidden until earned

    -- Order for display
    sort_order INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements (earned)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id),

    -- Progress tracking
    current_progress INTEGER DEFAULT 0,

    -- When earned
    earned_at TIMESTAMPTZ,

    -- Reward claimed
    reward_claimed BOOLEAN DEFAULT false,
    reward_claimed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, achievement_id)
);

-- Leaderboard snapshots (for weekly/monthly)
CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('orders', 'reviews', 'referrals', 'spending', 'points')),
    period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'all_time')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Rankings (array of {user_id, score, rank})
    rankings JSONB NOT NULL DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(leaderboard_type, period_type, period_start)
);

-- Indexes for achievements
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_is_active ON public.achievements(is_active);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON public.user_achievements(earned_at) WHERE earned_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_type ON public.leaderboard_snapshots(leaderboard_type, period_type);

-- RLS for achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

-- Everyone can view active achievements (except secret ones)
CREATE POLICY "View active achievements" ON public.achievements
    FOR SELECT USING (is_active = true AND (is_secret = false OR EXISTS (
        SELECT 1 FROM public.user_achievements
        WHERE achievement_id = achievements.id AND user_id = auth.uid() AND earned_at IS NOT NULL
    )));

-- Users view their own achievements
CREATE POLICY "View own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- System updates achievements (service role)
CREATE POLICY "System updates achievements" ON public.user_achievements
    FOR ALL USING (true);

-- Everyone can view leaderboards
CREATE POLICY "View leaderboards" ON public.leaderboard_snapshots
    FOR SELECT USING (true);

-- ================================================
-- 6. INSERT DEFAULT ACHIEVEMENTS
-- ================================================

INSERT INTO public.achievements (code, name, description, category, requirement_type, requirement_value, reward_type, reward_value, icon, rarity, sort_order)
VALUES
    -- Order achievements
    ('first_order', 'First Bite', 'Place your first order', 'orders', 'count', 1, 'points', 50, '🍽️', 'common', 1),
    ('orders_5', 'Regular', 'Complete 5 orders', 'orders', 'count', 5, 'points', 100, '⭐', 'common', 2),
    ('orders_25', 'Foodie', 'Complete 25 orders', 'orders', 'count', 25, 'credit', 25, '🌟', 'uncommon', 3),
    ('orders_100', 'Connoisseur', 'Complete 100 orders', 'orders', 'count', 100, 'credit', 100, '👑', 'rare', 4),
    ('orders_500', 'Food Legend', 'Complete 500 orders', 'orders', 'count', 500, 'credit', 500, '🏆', 'legendary', 5),

    -- Streak achievements
    ('streak_3', 'Getting Started', 'Order 3 days in a row', 'orders', 'streak', 3, 'points', 30, '🔥', 'common', 10),
    ('streak_7', 'Week Warrior', 'Order 7 days in a row', 'orders', 'streak', 7, 'credit', 20, '💪', 'uncommon', 11),
    ('streak_30', 'Monthly Master', 'Order 30 days in a row', 'orders', 'streak', 30, 'credit', 100, '🏅', 'epic', 12),

    -- Review achievements
    ('first_review', 'Critic', 'Write your first review', 'reviews', 'count', 1, 'points', 25, '✍️', 'common', 20),
    ('reviews_10', 'Reviewer', 'Write 10 reviews', 'reviews', 'count', 10, 'points', 100, '📝', 'uncommon', 21),
    ('reviews_50', 'Top Critic', 'Write 50 reviews', 'reviews', 'count', 50, 'credit', 50, '🎭', 'rare', 22),

    -- Explorer achievements
    ('restaurants_5', 'Explorer', 'Order from 5 different restaurants', 'explorer', 'unique_restaurants', 5, 'points', 50, '🗺️', 'common', 30),
    ('restaurants_25', 'Adventurer', 'Order from 25 different restaurants', 'explorer', 'unique_restaurants', 25, 'credit', 25, '🧭', 'uncommon', 31),
    ('restaurants_100', 'Food Nomad', 'Order from 100 different restaurants', 'explorer', 'unique_restaurants', 100, 'credit', 100, '🌍', 'epic', 32),

    -- Referral achievements
    ('first_referral', 'Connector', 'Refer your first friend', 'referrals', 'count', 1, 'credit', 25, '🤝', 'common', 40),
    ('referrals_5', 'Ambassador', 'Refer 5 friends', 'referrals', 'count', 5, 'credit', 50, '📢', 'uncommon', 41),
    ('referrals_25', 'Influencer', 'Refer 25 friends', 'referrals', 'count', 25, 'credit', 250, '⭐', 'epic', 42),

    -- Spending achievements
    ('spent_1000', 'Supporter', 'Spend R1,000 total', 'loyalty', 'total_spent', 1000, 'credit', 25, '💵', 'common', 50),
    ('spent_5000', 'Patron', 'Spend R5,000 total', 'loyalty', 'total_spent', 5000, 'credit', 100, '💎', 'uncommon', 51),
    ('spent_25000', 'VIP', 'Spend R25,000 total', 'loyalty', 'total_spent', 25000, 'credit', 500, '👑', 'rare', 52),

    -- Special achievements
    ('night_owl', 'Night Owl', 'Place 10 orders after midnight', 'special', 'custom', 10, 'points', 50, '🦉', 'uncommon', 60),
    ('early_bird', 'Early Bird', 'Place 10 orders before 7am', 'special', 'custom', 10, 'points', 50, '🐦', 'uncommon', 61),
    ('big_spender', 'Big Order', 'Place a single order over R500', 'special', 'custom', 500, 'points', 100, '💰', 'rare', 62)

ON CONFLICT (code) DO NOTHING;

-- ================================================
-- 7. HELPER FUNCTIONS
-- ================================================

-- Function to join a group order
CREATE OR REPLACE FUNCTION join_group_order(
    p_invite_code TEXT,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_group_order RECORD;
BEGIN
    -- Get group order by invite code
    SELECT * INTO v_group_order
    FROM public.group_orders
    WHERE invite_code = UPPER(p_invite_code)
    AND status = 'open';

    IF v_group_order IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite code');
    END IF;

    -- Check if deadline passed
    IF v_group_order.deadline < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Group order deadline has passed');
    END IF;

    -- Check if already a participant
    IF EXISTS (SELECT 1 FROM public.group_order_participants WHERE group_order_id = v_group_order.id AND user_id = p_user_id) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already a participant', 'group_order_id', v_group_order.id);
    END IF;

    -- Add as participant
    INSERT INTO public.group_order_participants (group_order_id, user_id, status)
    VALUES (v_group_order.id, p_user_id, 'joined');

    RETURN jsonb_build_object(
        'success', true,
        'group_order_id', v_group_order.id,
        'restaurant_id', v_group_order.restaurant_id,
        'deadline', v_group_order.deadline
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate group order totals
CREATE OR REPLACE FUNCTION calculate_group_order_totals(p_group_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_subtotal DECIMAL(10, 2);
    v_participant RECORD;
    v_participant_count INTEGER;
    v_service_fee_rate DECIMAL := 0.045; -- 4.5%
BEGIN
    -- Calculate subtotal from all items
    SELECT COALESCE(SUM(total_price), 0) INTO v_subtotal
    FROM public.group_order_items
    WHERE group_order_id = p_group_order_id;

    -- Get participant count
    SELECT COUNT(*) INTO v_participant_count
    FROM public.group_order_participants
    WHERE group_order_id = p_group_order_id AND status IN ('joined', 'submitted');

    -- Update group order totals
    UPDATE public.group_orders
    SET
        subtotal = v_subtotal,
        service_fee = v_subtotal * v_service_fee_rate,
        total = v_subtotal + (v_subtotal * v_service_fee_rate) + delivery_fee,
        updated_at = NOW()
    WHERE id = p_group_order_id;

    -- Update each participant's subtotal
    FOR v_participant IN
        SELECT gop.id, COALESCE(SUM(goi.total_price), 0) as participant_subtotal
        FROM public.group_order_participants gop
        LEFT JOIN public.group_order_items goi ON goi.participant_id = gop.id
        WHERE gop.group_order_id = p_group_order_id
        GROUP BY gop.id
    LOOP
        UPDATE public.group_order_participants
        SET
            subtotal = v_participant.participant_subtotal,
            share_amount = v_participant.participant_subtotal * (1 + v_service_fee_rate) +
                (SELECT delivery_fee / NULLIF(v_participant_count, 0) FROM public.group_orders WHERE id = p_group_order_id)
        WHERE id = v_participant.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_achievement RECORD;
    v_order_count INTEGER;
    v_review_count INTEGER;
    v_referral_count INTEGER;
    v_restaurant_count INTEGER;
    v_total_spent DECIMAL;
    v_current_value INTEGER;
    v_newly_earned TEXT[] := '{}';
BEGIN
    -- Get user stats
    SELECT COUNT(*) INTO v_order_count FROM public.orders WHERE customer_id = p_user_id AND status = 'delivered';
    SELECT COUNT(*) INTO v_review_count FROM public.restaurant_reviews WHERE user_id = p_user_id;
    SELECT COUNT(*) INTO v_referral_count FROM public.referrals WHERE referrer_id = p_user_id AND status = 'rewarded';
    SELECT COUNT(DISTINCT restaurant_id) INTO v_restaurant_count FROM public.orders WHERE customer_id = p_user_id AND status = 'delivered';
    SELECT COALESCE(SUM(total), 0) INTO v_total_spent FROM public.orders WHERE customer_id = p_user_id AND status = 'delivered';

    -- Check each active achievement
    FOR v_achievement IN
        SELECT a.* FROM public.achievements a
        LEFT JOIN public.user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = p_user_id
        WHERE a.is_active = true AND (ua.earned_at IS NULL OR ua.earned_at IS NULL)
    LOOP
        -- Determine current value based on requirement type
        CASE v_achievement.requirement_type
            WHEN 'count' THEN
                CASE v_achievement.category
                    WHEN 'orders' THEN v_current_value := v_order_count;
                    WHEN 'reviews' THEN v_current_value := v_review_count;
                    WHEN 'referrals' THEN v_current_value := v_referral_count;
                    ELSE v_current_value := 0;
                END CASE;
            WHEN 'unique_restaurants' THEN v_current_value := v_restaurant_count;
            WHEN 'total_spent' THEN v_current_value := v_total_spent::INTEGER;
            ELSE v_current_value := 0;
        END CASE;

        -- Update or insert progress
        INSERT INTO public.user_achievements (user_id, achievement_id, current_progress, earned_at)
        VALUES (
            p_user_id,
            v_achievement.id,
            v_current_value,
            CASE WHEN v_current_value >= v_achievement.requirement_value THEN NOW() ELSE NULL END
        )
        ON CONFLICT (user_id, achievement_id) DO UPDATE SET
            current_progress = EXCLUDED.current_progress,
            earned_at = CASE
                WHEN public.user_achievements.earned_at IS NULL AND EXCLUDED.current_progress >= v_achievement.requirement_value
                THEN NOW()
                ELSE public.user_achievements.earned_at
            END,
            updated_at = NOW();

        -- Track newly earned
        IF v_current_value >= v_achievement.requirement_value THEN
            v_newly_earned := array_append(v_newly_earned, v_achievement.code);
        END IF;
    END LOOP;

    RETURN jsonb_build_object('checked', true, 'newly_earned', v_newly_earned);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 8. TRIGGERS
-- ================================================

-- Update group order totals when items change
CREATE OR REPLACE FUNCTION trigger_update_group_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_group_order_totals(OLD.group_order_id);
    ELSE
        PERFORM calculate_group_order_totals(NEW.group_order_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_order_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.group_order_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_group_order_totals();

-- Check achievements when order is delivered
CREATE OR REPLACE FUNCTION trigger_check_achievements_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
        PERFORM check_achievements(NEW.customer_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_achievements_on_order_trigger
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_check_achievements_on_order();

-- Updated_at triggers
CREATE TRIGGER update_group_orders_updated_at
    BEFORE UPDATE ON public.group_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_group_order_items_updated_at
    BEFORE UPDATE ON public.group_order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at
    BEFORE UPDATE ON public.user_achievements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_issues_updated_at
    BEFORE UPDATE ON public.delivery_issues
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================
-- 9. GRANT PERMISSIONS
-- ================================================

GRANT SELECT ON public.achievements TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_achievements TO authenticated;
GRANT SELECT ON public.leaderboard_snapshots TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_order_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_order_items TO authenticated;

GRANT SELECT, INSERT ON public.delivery_confirmations TO authenticated;
GRANT SELECT, INSERT ON public.delivery_issues TO authenticated;

GRANT SELECT, INSERT ON public.menu_import_jobs TO authenticated;

GRANT SELECT ON public.scheduled_order_reminders TO authenticated;

-- Service role full access
GRANT ALL ON public.achievements TO service_role;
GRANT ALL ON public.user_achievements TO service_role;
GRANT ALL ON public.leaderboard_snapshots TO service_role;
GRANT ALL ON public.group_orders TO service_role;
GRANT ALL ON public.group_order_participants TO service_role;
GRANT ALL ON public.group_order_items TO service_role;
GRANT ALL ON public.delivery_confirmations TO service_role;
GRANT ALL ON public.delivery_issues TO service_role;
GRANT ALL ON public.menu_import_jobs TO service_role;
GRANT ALL ON public.scheduled_order_reminders TO service_role;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
