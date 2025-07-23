-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS votings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS options ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS votes ENABLE ROW LEVEL SECURITY;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS votings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID REFERENCES users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    multiple_choice BOOLEAN DEFAULT FALSE NOT NULL,
    reveal_mode TEXT CHECK (reveal_mode IN ('after_vote', 'after_end')) NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    voting_id UUID REFERENCES votings(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    voting_id UUID REFERENCES votings(id) ON DELETE CASCADE NOT NULL,
    option_id UUID REFERENCES options(id) ON DELETE CASCADE NOT NULL,
    voter_uuid TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    -- Constraint untuk mencegah vote ganda per opsi
    CONSTRAINT prevent_duplicate_option_votes UNIQUE (voting_id, option_id, voter_uuid)
);

-- Create trigger function untuk mencegah vote ganda
CREATE OR REPLACE FUNCTION check_duplicate_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM votes 
    WHERE voting_id = NEW.voting_id 
    AND option_id = NEW.option_id 
    AND voter_uuid = NEW.voter_uuid
  ) THEN
    RAISE EXCEPTION 'Duplicate vote not allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER prevent_duplicate_votes
BEFORE INSERT ON votes
FOR EACH ROW
EXECUTE FUNCTION check_duplicate_vote();

-- Create indexes untuk optimasi query
CREATE INDEX IF NOT EXISTS idx_votings_created_at ON votings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_voting_id ON votes(voting_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter_uuid ON votes(voter_uuid);
CREATE INDEX IF NOT EXISTS idx_options_voting_id ON options(voting_id);

-- RLS Policies untuk users
CREATE POLICY "Users can read all profiles"
    ON users FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- RLS Policies untuk votings
CREATE POLICY "Anyone can read votings"
    ON votings FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Authenticated users can create votings"
    ON votings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own votings"
    ON votings FOR UPDATE
    TO authenticated
    USING (auth.uid() = creator_id);

-- RLS Policies untuk options
CREATE POLICY "Anyone can read options"
    ON options FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Authenticated users can create options"
    ON options FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM votings
            WHERE id = voting_id
            AND creator_id = auth.uid()
        )
    );

-- RLS Policies untuk votes
CREATE POLICY "Anyone can read votes"
    ON votes FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Anyone can create votes"
    ON votes FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

-- Enable Realtime untuk votes
BEGIN;
-- Hapus publication jika sudah ada
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Buat ulang publication
CREATE PUBLICATION supabase_realtime;
COMMIT;

-- Tambahkan tabel votes ke realtime
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- Function untuk handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger untuk create user profile saat signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();