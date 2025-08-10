-- Phase 4: Storage policy separation and admin tooling
-- 1) Ensure avatars bucket exists (private)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'avatars'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('avatars', 'avatars', false);
  END IF;
END$$;

-- 2) Policies for public images bucket: anyone can read; only admins can write/update/delete
-- Drop existing conflicting policies if they exist to avoid duplicates (safe conditional drops)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read images bucket'
  ) THEN
    DROP POLICY "Public can read images bucket" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can insert into images bucket'
  ) THEN
    DROP POLICY "Admins can insert into images bucket" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can update images bucket'
  ) THEN
    DROP POLICY "Admins can update images bucket" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can delete from images bucket'
  ) THEN
    DROP POLICY "Admins can delete from images bucket" ON storage.objects;
  END IF;
END$$;

-- Create policies for images bucket
CREATE POLICY "Public can read images bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Admins can insert into images bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update images bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete from images bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'images' AND public.has_role(auth.uid(), 'admin'));

-- 3) Policies for private avatars bucket: owner (by folder) and admins
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can read own avatars'
  ) THEN
    DROP POLICY "Users can read own avatars" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can read all avatars'
  ) THEN
    DROP POLICY "Admins can read all avatars" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can insert own avatars'
  ) THEN
    DROP POLICY "Users can insert own avatars" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can insert avatars'
  ) THEN
    DROP POLICY "Admins can insert avatars" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update own avatars'
  ) THEN
    DROP POLICY "Users can update own avatars" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can update avatars'
  ) THEN
    DROP POLICY "Admins can update avatars" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete own avatars'
  ) THEN
    DROP POLICY "Users can delete own avatars" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admins can delete avatars'
  ) THEN
    DROP POLICY "Admins can delete avatars" ON storage.objects;
  END IF;
END$$;

-- Read policies
CREATE POLICY "Users can read own avatars"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can read all avatars"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin')
);

-- Insert policies
CREATE POLICY "Users can insert own avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can insert avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin')
);

-- Update policies
CREATE POLICY "Users can update own avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can update avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin')
);

-- Delete policies
CREATE POLICY "Users can delete own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can delete avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' AND public.has_role(auth.uid(), 'admin')
);