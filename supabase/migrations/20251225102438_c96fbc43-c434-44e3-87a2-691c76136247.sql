-- Create chat_sessions table for support chat
CREATE TABLE IF NOT EXISTS chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type text NOT NULL DEFAULT 'support' CHECK (session_type IN ('support', 'order', 'recommendation')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'escalated')),
  escalated_to uuid REFERENCES auth.users(id),
  order_id uuid,
  satisfaction_rating integer CHECK (satisfaction_rating IS NULL OR (satisfaction_rating >= 1 AND satisfaction_rating <= 5)),
  resolution_time_seconds integer,
  created_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

-- Create chat_messages table for storing chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'bot', 'agent')),
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'quick_reply', 'card', 'action')),
  metadata jsonb DEFAULT '{}',
  intent_detected text,
  confidence_score numeric,
  created_at timestamptz DEFAULT now()
);

-- Create faq_entries table for FAQ knowledge base
CREATE TABLE IF NOT EXISTS faq_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  keywords text[] DEFAULT '{}',
  helpful_count integer DEFAULT 0,
  not_helpful_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_faq_entries_category ON faq_entries(category);
CREATE INDEX IF NOT EXISTS idx_faq_entries_active ON faq_entries(is_active);

-- Enable RLS on all tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_sessions
CREATE POLICY "Users can view their own sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions" ON chat_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Admins can update all sessions" ON chat_sessions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their sessions" ON chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chat_sessions WHERE id = chat_messages.session_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert messages in their sessions" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chat_sessions WHERE id = chat_messages.session_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can view all messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Admins can insert messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- RLS Policies for faq_entries
CREATE POLICY "Anyone can view active FAQs" ON faq_entries
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage FAQs" ON faq_entries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Create increment_column function for FAQ voting
CREATE OR REPLACE FUNCTION increment_column(
  p_table_name text,
  p_column_name text,
  p_row_id uuid
) RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', p_table_name, p_column_name, p_column_name) USING p_row_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed some initial FAQ entries
INSERT INTO faq_entries (category, question, answer, keywords) VALUES
('orders', 'How do I track my order?', 'You can track your order in real-time by going to the Orders tab in the app. You''ll see your order status and, once picked up, the driver''s live location on the map.', ARRAY['track', 'order', 'status', 'where', 'location']),
('orders', 'Can I cancel my order?', 'You can cancel within 2 minutes of placing your order for a full refund. After the restaurant starts preparing, cancellation may incur a partial charge. Go to your order and tap "Cancel Order".', ARRAY['cancel', 'refund', 'stop']),
('payment', 'What payment methods do you accept?', 'We accept all major credit and debit cards (Visa, Mastercard, Amex), as well as EFT payments via PayFast. Cash on delivery is available at select restaurants.', ARRAY['pay', 'payment', 'card', 'cash', 'method']),
('payment', 'How do I get a refund?', 'To request a refund, go to your order in the Orders tab and select "Report Issue". Our team reviews all requests within 24 hours and processes eligible refunds to your original payment method.', ARRAY['refund', 'money', 'back', 'return']),
('delivery', 'How long does delivery take?', 'Delivery times vary based on restaurant preparation time and distance. You''ll see an estimated delivery time when placing your order, typically 25-45 minutes. Track your order for real-time updates.', ARRAY['delivery', 'time', 'long', 'wait', 'arrive']),
('account', 'How do I reset my password?', 'Click "Forgot Password" on the login screen and enter your email. You''ll receive a reset link within a few minutes. Check your spam folder if you don''t see it.', ARRAY['password', 'reset', 'forgot', 'login', 'account'])
ON CONFLICT DO NOTHING;