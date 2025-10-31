-- =============================================
-- FRIENDS SYSTEM - Friend Requests & Relationships
-- =============================================

-- Friend Requests Table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'blocked'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent duplicate requests
  UNIQUE(requester_id, receiver_id),
  -- Ensure requester and receiver are different
  CHECK (requester_id != receiver_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester ON friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester_status ON friend_requests(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_status ON friend_requests(receiver_id, status);

-- RLS Policies for Friend Requests
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests (sent or received)
CREATE POLICY "users_view_own_friend_requests" ON friend_requests
  FOR SELECT
  USING (
    auth.uid() = requester_id OR 
    auth.uid() = receiver_id
  );

-- Users can create friend requests
CREATE POLICY "users_create_friend_requests" ON friend_requests
  FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Users can update requests they received (accept/reject)
-- Users can also cancel requests they sent
CREATE POLICY "users_update_own_friend_requests" ON friend_requests
  FOR UPDATE
  USING (
    auth.uid() = requester_id OR 
    auth.uid() = receiver_id
  );

-- Users can delete requests they sent
CREATE POLICY "users_delete_own_sent_requests" ON friend_requests
  FOR DELETE
  USING (auth.uid() = requester_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_friend_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_friend_requests_timestamp
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_friend_requests_updated_at();

