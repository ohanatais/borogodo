-- Add evidences JSON array to entries (stores URL/image evidence items per entry)
ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS evidences JSONB NOT NULL DEFAULT '[]';

-- evidence-files storage bucket (public, max 10 MB, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence-files',
  'evidence-files',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users upload only into their own folder
CREATE POLICY "evidence files insert own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'evidence-files'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- RLS: anyone can read (public bucket)
CREATE POLICY "evidence files select public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'evidence-files');

-- RLS: users can delete their own evidence files
CREATE POLICY "evidence files delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'evidence-files'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
