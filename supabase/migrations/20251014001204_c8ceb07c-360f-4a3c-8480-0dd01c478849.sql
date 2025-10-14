-- Ensure Storage bucket exists (idempotent)
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

-- Create policies only if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Chat: users can upload their own files'
  ) THEN
    CREATE POLICY "Chat: users can upload their own files"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'chat-attachments'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Chat: users can update their own files'
  ) THEN
    CREATE POLICY "Chat: users can update their own files"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'chat-attachments'
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
      WITH CHECK (
        bucket_id = 'chat-attachments'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Chat: users can delete their own files'
  ) THEN
    CREATE POLICY "Chat: users can delete their own files"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'chat-attachments'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Chat: users can read their own files'
  ) THEN
    CREATE POLICY "Chat: users can read their own files"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'chat-attachments'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;