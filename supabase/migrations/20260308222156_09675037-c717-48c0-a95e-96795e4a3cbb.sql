
-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-images', 'restaurant-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('review-images', 'review-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('driver-documents', 'driver-documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-avatars', 'profile-avatars', true) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Anyone can view menu images" ON storage.objects FOR SELECT USING (bucket_id = 'menu-images');
CREATE POLICY "Restaurant owners can upload menu images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Restaurant owners can update menu images" ON storage.objects FOR UPDATE USING (bucket_id = 'menu-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Restaurant owners can delete menu images" ON storage.objects FOR DELETE USING (bucket_id = 'menu-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view restaurant images" ON storage.objects FOR SELECT USING (bucket_id = 'restaurant-images');
CREATE POLICY "Restaurant owners can upload restaurant images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'restaurant-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Restaurant owners can update restaurant images" ON storage.objects FOR UPDATE USING (bucket_id = 'restaurant-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view review images" ON storage.objects FOR SELECT USING (bucket_id = 'review-images');
CREATE POLICY "Authenticated users can upload review images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'review-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Drivers can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'driver-documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Drivers can view their documents" ON storage.objects FOR SELECT USING (bucket_id = 'driver-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'profile-avatars');
CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-avatars' AND auth.uid() IS NOT NULL);
