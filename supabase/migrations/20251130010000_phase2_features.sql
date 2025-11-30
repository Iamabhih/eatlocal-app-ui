-- ================================================
-- Phase 2: Core Completion Migration
-- Date: 2025-11-30
-- Features: Refunds, Referrals, Notification Queue, SMS
-- ================================================

-- ================================================
-- 1. REFUNDS SYSTEM
-- ================================================

-- Refunds table
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.payments(id),
    customer_id UUID NOT NULL REFERENCES auth.users(id),

    -- Refund details
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial', 'item')),

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'failed')),

    -- Processing details
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Payment provider details
    external_refund_id TEXT,
    refund_method TEXT CHECK (refund_method IN ('original_payment', 'wallet_credit', 'bank_transfer')),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refund items (for partial refunds)
CREATE TABLE IF NOT EXISTS public.refund_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refund_id UUID NOT NULL REFERENCES public.refunds(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id),

    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL,
    reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for refunds
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON public.refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_customer_id ON public.refunds(customer_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON public.refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_created_at ON public.refunds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refund_items_refund_id ON public.refund_items(refund_id);

-- RLS for refunds
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_items ENABLE ROW LEVEL SECURITY;

-- Customers can view their own refunds
CREATE POLICY "Customers view own refunds" ON public.refunds
    FOR SELECT USING (auth.uid() = customer_id);

-- Admins can manage all refunds
CREATE POLICY "Admins manage refunds" ON public.refunds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'superadmin')
        )
    );

-- Restaurant owners can view refunds for their orders
CREATE POLICY "Restaurant owners view refunds" ON public.refunds
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.restaurants r ON o.restaurant_id = r.id
            WHERE o.id = refunds.order_id
            AND r.owner_id = auth.uid()
        )
    );

-- Refund items follow parent refund access
CREATE POLICY "Access refund items via refund" ON public.refund_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.refunds
            WHERE id = refund_items.refund_id
            AND (customer_id = auth.uid() OR EXISTS (
                SELECT 1 FROM public.user_roles
                WHERE user_id = auth.uid()
                AND role IN ('admin', 'superadmin')
            ))
        )
    );

-- ================================================
-- 2. REFERRAL PROGRAM
-- ================================================

-- Referral codes table
CREATE TABLE IF NOT EXISTS public.referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    code TEXT NOT NULL UNIQUE,

    -- Limits
    max_uses INTEGER DEFAULT NULL, -- NULL = unlimited
    current_uses INTEGER DEFAULT 0,

    -- Rewards
    referrer_reward_type TEXT NOT NULL DEFAULT 'credit' CHECK (referrer_reward_type IN ('credit', 'points', 'discount', 'free_delivery')),
    referrer_reward_value DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
    referee_reward_type TEXT NOT NULL DEFAULT 'credit' CHECK (referee_reward_type IN ('credit', 'points', 'discount', 'free_delivery')),
    referee_reward_value DECIMAL(10, 2) NOT NULL DEFAULT 50.00,

    -- Validity
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,

    -- Campaign tracking
    campaign TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals tracking
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_code_id UUID NOT NULL REFERENCES public.referral_codes(id),
    referrer_id UUID NOT NULL REFERENCES auth.users(id),
    referee_id UUID NOT NULL REFERENCES auth.users(id),

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'rewarded', 'expired', 'cancelled')),

    -- Qualification (e.g., referee must complete first order)
    qualification_type TEXT DEFAULT 'first_order',
    qualified_at TIMESTAMPTZ,
    qualifying_order_id UUID REFERENCES public.orders(id),

    -- Rewards
    referrer_reward_status TEXT DEFAULT 'pending' CHECK (referrer_reward_status IN ('pending', 'credited', 'failed')),
    referrer_reward_credited_at TIMESTAMPTZ,
    referee_reward_status TEXT DEFAULT 'pending' CHECK (referee_reward_status IN ('pending', 'credited', 'failed')),
    referee_reward_credited_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(referee_id) -- Each user can only be referred once
);

-- Referral bonuses ledger
CREATE TABLE IF NOT EXISTS public.referral_bonuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES public.referrals(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),

    bonus_type TEXT NOT NULL CHECK (bonus_type IN ('referrer', 'referee')),
    reward_type TEXT NOT NULL,
    reward_value DECIMAL(10, 2) NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'credited', 'failed', 'expired')),
    credited_at TIMESTAMPTZ,

    -- If credit was applied to wallet
    wallet_transaction_id UUID,

    -- Expiry
    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for referrals
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON public.referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_user_id ON public.referral_bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_referral_id ON public.referral_bonuses(referral_id);

-- RLS for referrals
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_bonuses ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral codes
CREATE POLICY "Users view own referral codes" ON public.referral_codes
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own referral codes
CREATE POLICY "Users create referral codes" ON public.referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can view active referral codes (for validation)
CREATE POLICY "View active referral codes" ON public.referral_codes
    FOR SELECT USING (is_active = true);

-- Users can view referrals where they are involved
CREATE POLICY "Users view own referrals" ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Users can view their own bonuses
CREATE POLICY "Users view own bonuses" ON public.referral_bonuses
    FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all referral data
CREATE POLICY "Admins manage referral codes" ON public.referral_codes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

CREATE POLICY "Admins manage referrals" ON public.referrals
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

CREATE POLICY "Admins manage referral bonuses" ON public.referral_bonuses
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- ================================================
-- 3. NOTIFICATION QUEUE SYSTEM
-- ================================================

-- Notification templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL UNIQUE,
    description TEXT,

    -- Channel support
    supports_email BOOLEAN DEFAULT true,
    supports_sms BOOLEAN DEFAULT false,
    supports_push BOOLEAN DEFAULT true,
    supports_in_app BOOLEAN DEFAULT true,

    -- Templates (with variable placeholders like {{name}})
    email_subject TEXT,
    email_body TEXT,
    sms_body TEXT,
    push_title TEXT,
    push_body TEXT,
    in_app_title TEXT,
    in_app_body TEXT,

    -- Metadata
    category TEXT CHECK (category IN ('order', 'delivery', 'payment', 'promotion', 'account', 'system', 'ride', 'booking')),
    variables JSONB DEFAULT '[]'::jsonb, -- List of expected variables

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification queue
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Recipient
    user_id UUID REFERENCES auth.users(id),
    email TEXT,
    phone TEXT,

    -- Content
    template_id UUID REFERENCES public.notification_templates(id),
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push', 'in_app', 'whatsapp')),

    subject TEXT,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb, -- Additional data for rendering

    -- Scheduling
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'delivered', 'failed', 'cancelled')),

    -- Retry logic
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_attempt_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,

    -- Results
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    external_id TEXT, -- ID from email/SMS provider
    error_message TEXT,

    -- Tracking
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SMS logs (detailed tracking)
CREATE TABLE IF NOT EXISTS public.sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES public.notification_queue(id),

    phone TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Provider details
    provider TEXT NOT NULL DEFAULT 'twilio',
    external_id TEXT,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'undelivered', 'failed')),

    -- Cost tracking
    segments INTEGER DEFAULT 1,
    cost_per_segment DECIMAL(6, 4),
    total_cost DECIMAL(8, 4),
    currency TEXT DEFAULT 'ZAR',

    -- Error details
    error_code TEXT,
    error_message TEXT,

    -- Timestamps
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for notification system
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON public.notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON public.notification_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_queue_channel ON public.notification_queue(channel);
CREATE INDEX IF NOT EXISTS idx_notification_queue_retry ON public.notification_queue(next_retry_at) WHERE status = 'failed' AND attempts < max_attempts;
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON public.sms_logs(phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON public.sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_notification_id ON public.sms_logs(notification_id);

-- RLS for notification system
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Templates are readable by authenticated users
CREATE POLICY "View notification templates" ON public.notification_templates
    FOR SELECT USING (is_active = true);

-- Only admins can manage templates
CREATE POLICY "Admins manage templates" ON public.notification_templates
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Users can view their own notifications
CREATE POLICY "Users view own notifications" ON public.notification_queue
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service can insert notifications" ON public.notification_queue
    FOR INSERT WITH CHECK (true);

-- Admins can view all notifications
CREATE POLICY "Admins view all notifications" ON public.notification_queue
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- Only admins can view SMS logs
CREATE POLICY "Admins view SMS logs" ON public.sms_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
    );

-- ================================================
-- 4. INSERT DEFAULT NOTIFICATION TEMPLATES
-- ================================================

INSERT INTO public.notification_templates (name, description, category, supports_email, supports_sms, supports_push, email_subject, email_body, sms_body, push_title, push_body, variables)
VALUES
    ('order_placed', 'Sent when order is placed', 'order', true, true, true,
     'Order #{{order_number}} Confirmed',
     '<h1>Order Confirmed!</h1><p>Hi {{customer_name}}, your order #{{order_number}} from {{restaurant_name}} has been confirmed.</p>',
     'EatLocal: Order #{{order_number}} confirmed from {{restaurant_name}}. Track: {{tracking_url}}',
     'Order Confirmed! 🎉',
     'Your order from {{restaurant_name}} is being prepared',
     '["order_number", "customer_name", "restaurant_name", "tracking_url"]'::jsonb),

    ('order_ready', 'Sent when order is ready for pickup', 'order', true, true, true,
     'Order #{{order_number}} Ready for Pickup',
     '<h1>Your Order is Ready!</h1><p>Your order from {{restaurant_name}} is ready and waiting for the driver.</p>',
     'EatLocal: Order #{{order_number}} is ready! Driver on the way.',
     'Order Ready! 🍕',
     'Your food is packed and driver is on the way',
     '["order_number", "restaurant_name"]'::jsonb),

    ('order_delivered', 'Sent when order is delivered', 'order', true, false, true,
     'Order #{{order_number}} Delivered',
     '<h1>Enjoy Your Meal!</h1><p>Your order has been delivered. How was everything?</p><a href="{{review_url}}">Leave a Review</a>',
     NULL,
     'Order Delivered! 🎊',
     'Enjoy your meal! Tap to rate your experience',
     '["order_number", "review_url"]'::jsonb),

    ('driver_assigned', 'Sent when driver is assigned', 'delivery', false, true, true,
     NULL,
     NULL,
     'EatLocal: {{driver_name}} is picking up your order. ETA: {{eta}} mins',
     'Driver On The Way 🚗',
     '{{driver_name}} is heading to the restaurant',
     '["driver_name", "eta"]'::jsonb),

    ('ride_accepted', 'Sent when ride is accepted', 'ride', false, true, true,
     NULL,
     NULL,
     'EatLocal Ride: {{driver_name}} accepted your ride. {{car_model}} {{car_color}}. ETA: {{eta}} mins',
     'Ride Accepted! 🚗',
     '{{driver_name}} is on the way in a {{car_color}} {{car_model}}',
     '["driver_name", "car_model", "car_color", "eta"]'::jsonb),

    ('ride_arrived', 'Sent when driver arrives', 'ride', false, true, true,
     NULL,
     NULL,
     'EatLocal Ride: Your driver has arrived! Look for {{car_model}} {{car_color}}',
     'Driver Arrived! 📍',
     '{{driver_name}} is waiting for you',
     '["driver_name", "car_model", "car_color"]'::jsonb),

    ('payment_received', 'Sent when payment is confirmed', 'payment', true, false, true,
     'Payment Received - R{{amount}}',
     '<h1>Payment Confirmed</h1><p>We received your payment of R{{amount}} for order #{{order_number}}.</p>',
     NULL,
     'Payment Received ✓',
     'R{{amount}} payment confirmed',
     '["amount", "order_number"]'::jsonb),

    ('refund_processed', 'Sent when refund is processed', 'payment', true, true, true,
     'Refund Processed - R{{amount}}',
     '<h1>Refund Processed</h1><p>Your refund of R{{amount}} for order #{{order_number}} has been processed. It may take 5-10 business days to reflect.</p>',
     'EatLocal: Refund of R{{amount}} processed for order #{{order_number}}',
     'Refund Processed 💰',
     'R{{amount}} refund on its way',
     '["amount", "order_number"]'::jsonb),

    ('booking_confirmed', 'Sent when hotel/venue booking confirmed', 'booking', true, true, true,
     'Booking Confirmed - {{venue_name}}',
     '<h1>Booking Confirmed!</h1><p>Your booking at {{venue_name}} for {{date}} is confirmed. Booking ref: {{booking_ref}}</p>',
     'EatLocal: Booking at {{venue_name}} confirmed for {{date}}. Ref: {{booking_ref}}',
     'Booking Confirmed! 🏨',
     '{{venue_name}} on {{date}}',
     '["venue_name", "date", "booking_ref"]'::jsonb),

    ('referral_reward', 'Sent when referral reward is credited', 'promotion', true, false, true,
     'You Earned R{{amount}}! 🎁',
     '<h1>Referral Reward!</h1><p>Great news! Your friend {{friend_name}} used your referral code. R{{amount}} has been added to your wallet.</p>',
     NULL,
     'Referral Reward! 🎁',
     'R{{amount}} added to your wallet',
     '["amount", "friend_name"]'::jsonb)

ON CONFLICT (name) DO NOTHING;

-- ================================================
-- 5. HELPER FUNCTIONS
-- ================================================

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    attempts INTEGER := 0;
BEGIN
    LOOP
        -- Generate code: USER_XXXX (first 4 chars of user id + random 4 chars)
        code := UPPER(SUBSTRING(user_id::TEXT, 1, 4) || SUBSTRING(MD5(RANDOM()::TEXT), 1, 4));

        -- Check if unique
        IF NOT EXISTS (SELECT 1 FROM public.referral_codes WHERE referral_codes.code = code) THEN
            RETURN code;
        END IF;

        attempts := attempts + 1;
        IF attempts > 10 THEN
            -- Fallback to longer code
            code := UPPER(SUBSTRING(MD5(user_id::TEXT || NOW()::TEXT || RANDOM()::TEXT), 1, 10));
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to process refund
CREATE OR REPLACE FUNCTION process_refund(
    p_refund_id UUID,
    p_processor_id UUID,
    p_approved BOOLEAN,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_refund RECORD;
    v_result JSONB;
BEGIN
    -- Get refund details
    SELECT * INTO v_refund FROM public.refunds WHERE id = p_refund_id FOR UPDATE;

    IF v_refund IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Refund not found');
    END IF;

    IF v_refund.status != 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Refund already processed');
    END IF;

    IF p_approved THEN
        -- Update refund status to processing
        UPDATE public.refunds
        SET status = 'processing',
            processed_by = p_processor_id,
            processed_at = NOW(),
            updated_at = NOW()
        WHERE id = p_refund_id;

        -- If refund method is wallet_credit, add to wallet immediately
        IF v_refund.refund_method = 'wallet_credit' THEN
            INSERT INTO public.wallet_transactions (
                wallet_id,
                amount,
                type,
                description,
                reference_id,
                reference_type
            )
            SELECT
                w.id,
                v_refund.amount,
                'credit',
                'Refund for order',
                v_refund.order_id,
                'refund'
            FROM public.wallets w
            WHERE w.user_id = v_refund.customer_id;

            -- Update wallet balance
            UPDATE public.wallets
            SET balance = balance + v_refund.amount,
                updated_at = NOW()
            WHERE user_id = v_refund.customer_id;

            -- Mark refund as completed
            UPDATE public.refunds
            SET status = 'completed',
                updated_at = NOW()
            WHERE id = p_refund_id;
        END IF;

        v_result := jsonb_build_object('success', true, 'status', 'processing');
    ELSE
        -- Reject refund
        UPDATE public.refunds
        SET status = 'rejected',
            processed_by = p_processor_id,
            processed_at = NOW(),
            rejection_reason = p_rejection_reason,
            updated_at = NOW()
        WHERE id = p_refund_id;

        v_result := jsonb_build_object('success', true, 'status', 'rejected');
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply referral code
CREATE OR REPLACE FUNCTION apply_referral_code(
    p_referee_id UUID,
    p_code TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_referral_code RECORD;
    v_referral_id UUID;
BEGIN
    -- Check if user was already referred
    IF EXISTS (SELECT 1 FROM public.referrals WHERE referee_id = p_referee_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User already has a referral');
    END IF;

    -- Get referral code
    SELECT * INTO v_referral_code
    FROM public.referral_codes
    WHERE code = UPPER(p_code)
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);

    IF v_referral_code IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired referral code');
    END IF;

    -- Can't refer yourself
    IF v_referral_code.user_id = p_referee_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code');
    END IF;

    -- Create referral
    INSERT INTO public.referrals (
        referral_code_id,
        referrer_id,
        referee_id,
        status
    )
    VALUES (
        v_referral_code.id,
        v_referral_code.user_id,
        p_referee_id,
        'pending'
    )
    RETURNING id INTO v_referral_id;

    -- Increment usage
    UPDATE public.referral_codes
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = v_referral_code.id;

    -- Credit referee reward immediately (referrer gets rewarded after first order)
    INSERT INTO public.referral_bonuses (
        referral_id,
        user_id,
        bonus_type,
        reward_type,
        reward_value,
        status,
        expires_at
    )
    VALUES (
        v_referral_id,
        p_referee_id,
        'referee',
        v_referral_code.referee_reward_type,
        v_referral_code.referee_reward_value,
        'pending',
        NOW() + INTERVAL '30 days'
    );

    RETURN jsonb_build_object(
        'success', true,
        'referral_id', v_referral_id,
        'reward_type', v_referral_code.referee_reward_type,
        'reward_value', v_referral_code.referee_reward_value
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to queue notification
CREATE OR REPLACE FUNCTION queue_notification(
    p_user_id UUID,
    p_template_name TEXT,
    p_channel TEXT,
    p_data JSONB DEFAULT '{}'::jsonb,
    p_scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    p_priority INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
    v_template RECORD;
    v_subject TEXT;
    v_body TEXT;
    v_notification_id UUID;
BEGIN
    -- Get template
    SELECT * INTO v_template
    FROM public.notification_templates
    WHERE name = p_template_name AND is_active = true;

    IF v_template IS NULL THEN
        RAISE EXCEPTION 'Template not found: %', p_template_name;
    END IF;

    -- Get body based on channel
    CASE p_channel
        WHEN 'email' THEN
            v_subject := v_template.email_subject;
            v_body := v_template.email_body;
        WHEN 'sms' THEN
            v_body := v_template.sms_body;
        WHEN 'push' THEN
            v_subject := v_template.push_title;
            v_body := v_template.push_body;
        WHEN 'in_app' THEN
            v_subject := v_template.in_app_title;
            v_body := v_template.in_app_body;
        ELSE
            RAISE EXCEPTION 'Invalid channel: %', p_channel;
    END CASE;

    IF v_body IS NULL THEN
        RAISE EXCEPTION 'Template % does not support channel %', p_template_name, p_channel;
    END IF;

    -- Insert into queue
    INSERT INTO public.notification_queue (
        user_id,
        template_id,
        channel,
        subject,
        body,
        data,
        scheduled_for,
        priority
    )
    VALUES (
        p_user_id,
        v_template.id,
        p_channel,
        v_subject,
        v_body,
        p_data,
        p_scheduled_for,
        p_priority
    )
    RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 6. UPDATE TRIGGERS
-- ================================================

-- Updated_at trigger for new tables
CREATE TRIGGER update_refunds_updated_at
    BEFORE UPDATE ON public.refunds
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referral_codes_updated_at
    BEFORE UPDATE ON public.referral_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON public.referrals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON public.notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_queue_updated_at
    BEFORE UPDATE ON public.notification_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================
-- 7. GRANT PERMISSIONS
-- ================================================

GRANT SELECT ON public.notification_templates TO authenticated;
GRANT SELECT ON public.notification_queue TO authenticated;
GRANT SELECT ON public.refunds TO authenticated;
GRANT SELECT ON public.refund_items TO authenticated;
GRANT SELECT, INSERT ON public.referral_codes TO authenticated;
GRANT SELECT ON public.referrals TO authenticated;
GRANT SELECT ON public.referral_bonuses TO authenticated;

-- Service role full access
GRANT ALL ON public.notification_templates TO service_role;
GRANT ALL ON public.notification_queue TO service_role;
GRANT ALL ON public.sms_logs TO service_role;
GRANT ALL ON public.refunds TO service_role;
GRANT ALL ON public.refund_items TO service_role;
GRANT ALL ON public.referral_codes TO service_role;
GRANT ALL ON public.referrals TO service_role;
GRANT ALL ON public.referral_bonuses TO service_role;

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
