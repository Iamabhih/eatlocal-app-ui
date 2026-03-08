-- 1. Fix panic_alerts: remove user_id IS NULL branch from SELECT, restrict anonymous alerts to admins
DROP POLICY IF EXISTS "Users can view their own alerts" ON public.panic_alerts;
CREATE POLICY "Users can view their own alerts"
ON public.panic_alerts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- 2. Fix logging tables: require authentication for INSERT
DROP POLICY IF EXISTS "Anyone can insert error logs" ON public.error_logs;
CREATE POLICY "Authenticated users can insert error logs"
ON public.error_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert system logs" ON public.system_logs;
CREATE POLICY "Authenticated users can insert system logs"
ON public.system_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert api call logs" ON public.api_call_logs;
CREATE POLICY "Authenticated users can insert api call logs"
ON public.api_call_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can insert interaction logs" ON public.user_interaction_logs;
CREATE POLICY "Authenticated users can insert interaction logs"
ON public.user_interaction_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. Fix system_health: require authentication for INSERT
DROP POLICY IF EXISTS "Anyone can insert health checks" ON public.system_health;
CREATE POLICY "Authenticated users can insert health checks"
ON public.system_health FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. Fix hotel/experience bookings: require authentication
DROP POLICY IF EXISTS "Guests can create bookings" ON public.hotel_bookings;
CREATE POLICY "Authenticated guests can create bookings"
ON public.hotel_bookings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = guest_id);

DROP POLICY IF EXISTS "Guests can create bookings" ON public.experience_bookings;
CREATE POLICY "Authenticated guests can create bookings"
ON public.experience_bookings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = guest_id);