-- World Class Enhancements Migration
-- This migration adds tables and features for world-class app functionality

-- ==========================================
-- 1. User Favorites Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, restaurant_id)
);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own favorites"
    ON public.user_favorites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
    ON public.user_favorites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites"
    ON public.user_favorites FOR DELETE
    USING (auth.uid() = user_id);

-- ==========================================
-- 2. Reviews Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    food_rating DECIMAL(2,1) CHECK (food_rating >= 1 AND food_rating <= 5),
    delivery_rating DECIMAL(2,1) CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
    review_text TEXT,
    images TEXT[] DEFAULT '{}',
    is_anonymous BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    response_text TEXT,
    response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, order_id)
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view reviews"
    ON public.reviews FOR SELECT
    USING (true);

CREATE POLICY "Users can create reviews for their orders"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to increment helpful count
CREATE OR REPLACE FUNCTION public.increment_helpful_count(review_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.reviews
    SET helpful_count = helpful_count + 1
    WHERE id = review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. Push Subscriptions Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT,
    auth TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own subscriptions"
    ON public.push_subscriptions FOR ALL
    USING (auth.uid() = user_id);

-- ==========================================
-- 4. Loyalty Points Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.loyalty_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points_balance INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    total_points_redeemed INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own loyalty points"
    ON public.loyalty_points FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage loyalty points"
    ON public.loyalty_points FOR ALL
    USING (true);

-- ==========================================
-- 5. Loyalty Transactions Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'bonus', 'expired', 'adjustment')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transactions"
    ON public.loyalty_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- ==========================================
-- 6. Scheduled Orders Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.scheduled_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(order_id)
);

-- Enable RLS
ALTER TABLE public.scheduled_orders ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 7. Menu Item Variants Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.menu_item_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_modifier DECIMAL(10,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.menu_item_variants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view variants"
    ON public.menu_item_variants FOR SELECT
    USING (true);

-- ==========================================
-- 8. Menu Item Modifiers Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.menu_item_modifiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
    group_name TEXT NOT NULL,
    name TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false,
    max_selections INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.menu_item_modifiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view modifiers"
    ON public.menu_item_modifiers FOR SELECT
    USING (true);

-- ==========================================
-- 9. Order Item Modifiers Table (for selected modifiers)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.order_item_modifiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_item_id UUID NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
    modifier_id UUID REFERENCES public.menu_item_modifiers(id) ON DELETE SET NULL,
    modifier_name TEXT NOT NULL,
    modifier_price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 10. In-App Messages Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.order_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'restaurant', 'delivery_partner', 'system')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Order participants can view messages"
    ON public.order_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_id
            AND (
                o.customer_id = auth.uid()
                OR o.delivery_partner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.restaurants r
                    WHERE r.id = o.restaurant_id AND r.owner_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Order participants can send messages"
    ON public.order_messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- ==========================================
-- 11. Add dietary_options to restaurants
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'restaurants' AND column_name = 'dietary_options'
    ) THEN
        ALTER TABLE public.restaurants ADD COLUMN dietary_options TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- ==========================================
-- 12. Add delivery_instructions to customer_addresses
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customer_addresses' AND column_name = 'delivery_instructions'
    ) THEN
        ALTER TABLE public.customer_addresses ADD COLUMN delivery_instructions TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customer_addresses' AND column_name = 'apartment'
    ) THEN
        ALTER TABLE public.customer_addresses ADD COLUMN apartment TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'customer_addresses' AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.customer_addresses ADD COLUMN phone TEXT;
    END IF;
END $$;

-- ==========================================
-- 13. Add tip to orders
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'tip_amount'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN tip_amount DECIMAL(10,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'orders' AND column_name = 'scheduled_for'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ==========================================
-- 14. Restaurant approval status
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'restaurants' AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE public.restaurants ADD COLUMN approval_status TEXT DEFAULT 'pending'
            CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'restaurants' AND column_name = 'approval_notes'
    ) THEN
        ALTER TABLE public.restaurants ADD COLUMN approval_notes TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'restaurants' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE public.restaurants ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ==========================================
-- 15. Create indexes for performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON public.reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON public.order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON public.loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_approval_status ON public.restaurants(approval_status);

-- ==========================================
-- 16. Update trigger for updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to new tables
DROP TRIGGER IF EXISTS set_reviews_updated_at ON public.reviews;
CREATE TRIGGER set_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER set_push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_loyalty_points_updated_at ON public.loyalty_points;
CREATE TRIGGER set_loyalty_points_updated_at
    BEFORE UPDATE ON public.loyalty_points
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- Migration Complete
-- ==========================================
COMMENT ON TABLE public.user_favorites IS 'Stores user restaurant favorites';
COMMENT ON TABLE public.reviews IS 'Stores restaurant reviews from customers';
COMMENT ON TABLE public.push_subscriptions IS 'Stores push notification subscriptions';
COMMENT ON TABLE public.loyalty_points IS 'Stores user loyalty point balances';
COMMENT ON TABLE public.loyalty_transactions IS 'Stores loyalty point transaction history';
COMMENT ON TABLE public.menu_item_variants IS 'Stores menu item size/variant options';
COMMENT ON TABLE public.menu_item_modifiers IS 'Stores menu item modifier options (toppings, extras)';
COMMENT ON TABLE public.order_messages IS 'Stores in-app messages between order participants';
