CREATE TABLE public.saved_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  match_percent integer,
  word_count integer NOT NULL DEFAULT 0,
  sections_present jsonb NOT NULL DEFAULT '[]'::jsonb,
  skills_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  skills_missing jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggestions jsonb NOT NULL DEFAULT '[]'::jsonb,
  breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX saved_analyses_user_created_idx ON public.saved_analyses (user_id, created_at DESC);

GRANT SELECT, INSERT, DELETE ON public.saved_analyses TO authenticated;
GRANT ALL ON public.saved_analyses TO service_role;

ALTER TABLE public.saved_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own analyses"
  ON public.saved_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own analyses"
  ON public.saved_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own analyses"
  ON public.saved_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);