-- Create enums for logging
CREATE TYPE log_level AS ENUM ('info', 'warn', 'error', 'debug');
CREATE TYPE log_type AS ENUM ('click', 'navigation', 'api_call', 'error', 'performance', 'form_submit');
CREATE TYPE error_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE interaction_event_type AS ENUM ('click', 'hover', 'scroll', 'input', 'focus', 'blur');

-- Create system_logs table
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  log_level log_level NOT NULL DEFAULT 'info',
  log_type log_type NOT NULL,
  component TEXT,
  action TEXT NOT NULL,
  target TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  user_agent TEXT,
  page_url TEXT NOT NULL,
  referrer TEXT
);

-- Create api_call_logs table
CREATE TABLE public.api_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT
);

-- Create error_logs table
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  component TEXT,
  severity error_severity NOT NULL DEFAULT 'medium',
  resolved BOOLEAN NOT NULL DEFAULT false,
  browser_info JSONB,
  page_url TEXT NOT NULL
);

-- Create user_interaction_logs table
CREATE TABLE public.user_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  event_type interaction_event_type NOT NULL,
  element_id TEXT,
  element_class TEXT,
  element_text TEXT,
  page_path TEXT NOT NULL,
  x_coordinate INTEGER,
  y_coordinate INTEGER,
  viewport_width INTEGER NOT NULL,
  viewport_height INTEGER NOT NULL
);

-- Enable RLS on all log tables
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interaction_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_logs
CREATE POLICY "Admins can view all system logs"
  ON public.system_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Anyone can insert system logs"
  ON public.system_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own system logs"
  ON public.system_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for api_call_logs
CREATE POLICY "Admins can view all api call logs"
  ON public.api_call_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Anyone can insert api call logs"
  ON public.api_call_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own api call logs"
  ON public.api_call_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for error_logs
CREATE POLICY "Admins can view all error logs"
  ON public.error_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Admins can update error logs"
  ON public.error_logs
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Anyone can insert error logs"
  ON public.error_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own error logs"
  ON public.error_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for user_interaction_logs
CREATE POLICY "Admins can view all interaction logs"
  ON public.user_interaction_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Anyone can insert interaction logs"
  ON public.user_interaction_logs
  FOR INSERT
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX idx_system_logs_session_id ON public.system_logs(session_id);
CREATE INDEX idx_system_logs_log_type ON public.system_logs(log_type);
CREATE INDEX idx_system_logs_success ON public.system_logs(success);

CREATE INDEX idx_api_call_logs_created_at ON public.api_call_logs(created_at DESC);
CREATE INDEX idx_api_call_logs_endpoint ON public.api_call_logs(endpoint);
CREATE INDEX idx_api_call_logs_success ON public.api_call_logs(success);

CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);

CREATE INDEX idx_user_interaction_logs_created_at ON public.user_interaction_logs(created_at DESC);
CREATE INDEX idx_user_interaction_logs_event_type ON public.user_interaction_logs(event_type);
CREATE INDEX idx_user_interaction_logs_page_path ON public.user_interaction_logs(page_path);

-- Create function for log cleanup (retention: 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.system_logs WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.api_call_logs WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM public.error_logs WHERE created_at < NOW() - INTERVAL '90 days' AND resolved = true;
  DELETE FROM public.user_interaction_logs WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;