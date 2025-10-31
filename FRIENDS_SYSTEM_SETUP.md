# Friends System Setup Guide

## Overview
The friends system allows users to send friend requests, accept/reject requests, and view only their friends' progress instead of all users' progress.

## Database Setup

### Step 1: Run the Migration
You need to run the friend requests table migration:

1. **For Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase-migrations/2025-01-15-friends-system.sql`
   - Click "Run" to execute

2. **For PostgreSQL (Local/Other):**
   ```bash
   psql -h localhost -U your_username -d your_database
   \i supabase-migrations/2025-01-15-friends-system.sql
   ```

### Step 2: Set Up Row Level Security (RLS) Policies
The migration includes RLS policies, but verify they're enabled:

```sql
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
```

The policies created are:
- `users_view_own_friend_requests` - Users can view their sent/received requests
- `users_create_friend_requests` - Users can create friend requests (as requester)
- `users_update_own_friend_requests` - Users can accept/reject/cancel their requests
- `users_delete_own_sent_requests` - Users can delete requests they sent

## Features

### ✅ What's Included

1. **Friend Requests Management:**
   - Send friend requests to other users
   - Accept/reject incoming friend requests
   - Cancel pending sent requests
   - Remove friends (unfriend)

2. **Friends' Progress Section:**
   - Renamed from "Others' Progress" to "Friends' Progress"
   - Only shows progress of accepted friends
   - Shows friend count in the header

3. **UI Components:**
   - Collapsible "Friends & Requests" section
   - Badge showing pending request count
   - Separate sections for:
     - Received Requests (with Accept/Reject buttons)
     - Sent Requests (with Cancel button)
     - Current Friends (with Remove button)
     - Add Friends (list of users you can send requests to)

4. **API Endpoints:**
   - `GET /api/friends?type=friends` - Get all accepted friends
   - `GET /api/friends?type=received` - Get pending received requests
   - `GET /api/friends?type=sent` - Get pending sent requests
   - `POST /api/friends` - Send a friend request
   - `PUT /api/friends` - Accept/reject a friend request
   - `DELETE /api/friends?id=...` - Cancel/remove friend

## How It Works

1. **Sending a Friend Request:**
   - Users see a list of other registered users (excluding themselves and existing friends)
   - Click "Add Friend" next to a user's name
   - Request is sent and appears in "Sent Requests"

2. **Accepting a Request:**
   - When someone sends you a request, it appears in "Received Requests"
   - Click "Accept" to become friends
   - The friend's progress will now appear in "Friends' Progress"

3. **Viewing Friends' Progress:**
   - Only accepted friends' progress is shown in the "Friends' Progress" table
   - Same table layout as before, but filtered to friends only

## Database Schema

The `friend_requests` table structure:
- `id` - UUID primary key
- `requester_id` - UUID reference to auth.users (who sent the request)
- `receiver_id` - UUID reference to auth.users (who receives the request)
- `status` - TEXT ('pending', 'accepted', 'rejected', 'blocked')
- `created_at` - Timestamp
- `updated_at` - Auto-updated timestamp

## Security

- Row Level Security (RLS) is enabled
- Users can only see/modify their own friend requests
- Cannot send friend request to themselves
- Duplicate requests are prevented (UNIQUE constraint)
- All API endpoints require authentication

## Notes

- Friend requests are based on `user_id` (from auth.users), not profile ID
- Only users with profiles linked to auth.users can send/receive requests
- The system automatically refreshes friends list every 30 seconds
- Friends list is cached in component state for performance

