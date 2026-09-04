-- ============================================================================
-- Movive — Allow listing objects in the public `recipe-images` bucket
-- Version: 00011
-- Purpose: The bucket is public for DOWNLOAD (public URLs work), but LISTing
--          objects (SELECT on storage.objects) requires an explicit RLS policy.
--          Without it, the browser (anon/authenticated) sees an empty list, so
--          the "Sync Recipe Images" tool cannot discover uploaded images.
--
--          This adds a SELECT policy scoped to the recipe-images bucket for
--          authenticated users, so admins can list/scan its files. Objects in
--          other buckets are unaffected.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'recipe_images_list_authenticated'
  ) THEN
    CREATE POLICY "recipe_images_list_authenticated"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'recipe-images');
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION 00011
-- ============================================================================
