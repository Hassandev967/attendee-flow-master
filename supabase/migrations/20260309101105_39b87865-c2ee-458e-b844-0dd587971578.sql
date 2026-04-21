
-- Add image_url column to formations
ALTER TABLE public.formations ADD COLUMN image_url text;

-- Create storage bucket for formation images
INSERT INTO storage.buckets (id, name, public) VALUES ('formations', 'formations', true);

-- Allow authenticated users to upload formation images
CREATE POLICY "Authenticated users can upload formation images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'formations');

-- Allow authenticated users to update formation images
CREATE POLICY "Authenticated users can update formation images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'formations');

-- Allow authenticated users to delete formation images
CREATE POLICY "Authenticated users can delete formation images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'formations');

-- Allow public read access to formation images
CREATE POLICY "Public read access for formation images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'formations');
