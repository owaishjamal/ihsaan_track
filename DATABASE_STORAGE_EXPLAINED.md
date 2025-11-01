# Where Data is Stored in the Database

## 🔐 Passwords (Authentication)

**Location:** `auth.users` table (Supabase Auth system)

**Important Notes:**
- ❌ **NOT stored in your custom tables**
- ✅ Stored securely by Supabase Auth in the `auth.users` table
- 🔒 Passwords are **hashed** (never stored in plain text)
- 🚫 **You cannot directly access** this table from your application
- 🔑 Only Supabase Auth can read/write passwords

**What's in `auth.users`:**
- `id` - UUID (this is what links to your profiles table)
- `email` - User's email address
- `encrypted_password` - Hashed password (not readable)
- `email_confirmed_at` - When email was confirmed
- `created_at` - Account creation date
- Other auth-related fields

**How it works:**
1. User signs up → Supabase creates record in `auth.users`
2. Password is hashed and stored in `auth.users.encrypted_password`
3. Your app gets a `user.id` (UUID) from `auth.users`
4. You link this `user.id` to your `profiles` table via `user_id` column

---

## 👤 Profiles (User Information)

**Location:** `profiles` table (public schema - your custom table)

**Table Structure:**
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,                    -- Profile ID (separate from user ID)
  name TEXT NOT NULL,                      -- User's display name
  color TEXT DEFAULT '#3b82f6',            -- Profile color
  email TEXT UNIQUE,                       -- Optional email (can differ from auth email)
  phone TEXT,                              -- Optional phone number
  date_of_birth DATE,                      -- Optional date of birth
  user_id UUID REFERENCES auth.users(id),  -- ⭐ Links to auth.users table
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Key Points:**
- ✅ This is **your custom table** - you can read/write from your app
- 🔗 `user_id` column **links to `auth.users.id`**
- 📝 Stores **application data** (name, preferences, etc.)
- 🌐 **Not** where passwords are stored

---

## 🔗 How They're Connected

```
┌─────────────────┐         ┌──────────────────┐
│   auth.users    │         │    profiles      │
├─────────────────┤         ├──────────────────┤
│ id (UUID)       │◄────────│ user_id (UUID)   │
│ email           │         │ id (UUID)        │
│ encrypted_pwd   │         │ name             │
│ created_at      │         │ color            │
└─────────────────┘         └──────────────────┘
     ↑                           ↑
     │                           │
   Managed by                Your custom
   Supabase Auth             application table
```

**Relationship:**
- One `auth.users` record = One authenticated user account
- One `profiles` record = One user profile (linked via `user_id`)
- One user can have multiple profiles (if you allow it), but typically one-to-one

---

## 📍 Where to Find Data in Supabase Dashboard

### View Passwords/Users:
1. Go to **Authentication** → **Users** section
2. You'll see:
   - Email addresses
   - User IDs (UUID)
   - Creation dates
   - Email confirmation status
   - ⚠️ **Passwords are NOT visible** (they're hashed)

### View Profiles:
1. Go to **Table Editor**
2. Select **`profiles`** table
3. You'll see:
   - Profile IDs
   - Names
   - Colors
   - `user_id` column (this links to auth.users)

---

## 🛡️ Security Notes

### Passwords:
- ✅ **Never stored in plain text**
- ✅ **Hashed using bcrypt** (industry standard)
- ✅ **Only Supabase Auth** can verify passwords
- ✅ **You cannot retrieve original passwords** (by design)

### Profiles:
- ✅ Stored in your custom table
- ✅ Protected by **Row Level Security (RLS)**
- ✅ Only the owner (`user_id` matches logged-in user) can modify their profile
- ✅ Anyone can read profiles (for friend system)

---

## 🔍 Example Query (How They Work Together)

When a user logs in:
1. Supabase checks `auth.users` table → verifies password
2. Returns `user.id` (UUID)
3. Your app queries `profiles` table:
   ```sql
   SELECT * FROM profiles WHERE user_id = 'abc-123-user-id';
   ```
4. Returns the user's profile information

---

## 📊 Other Data Tables

All other data is stored in your custom tables:

- **`entries`** - Daily prayer/dhikr tracking
  - Linked via `profile_id` → `profiles.id`

- **`quran_progress`** - Quran reading progress
  - Linked via `profile_id` → `profiles.id`

- **`dhikr_progress`** - Dhikr counts
  - Linked via `profile_id` → `profiles.id`

- **`friend_requests`** - Friend requests
  - Linked via `requester_id` and `receiver_id` → `auth.users.id`

- **`tasks`** - Daily tasks
  - Linked via `user_id` → `auth.users.id`

---

## ⚠️ Important Reminders

1. **You CANNOT access passwords directly** - Supabase Auth handles this
2. **You CAN read/write profiles** - This is your custom table
3. **Always link via `user_id`** - Don't try to join on email (use UUID)
4. **Passwords are one-way hashed** - Cannot be "unhashed" or retrieved

---

## 🎯 Summary

| Data Type | Storage Location | Accessible? | Purpose |
|-----------|-----------------|-------------|---------|
| **Passwords** | `auth.users` (Supabase) | ❌ No direct access | Authentication |
| **User Profiles** | `profiles` (your table) | ✅ Yes | Application data |
| **User ID** | Both tables | ✅ Yes | Links them together |

**In simple terms:**
- **Passwords** → Supabase's secure `auth.users` table (hashed, protected)
- **Profiles** → Your `profiles` table (public schema, accessible)
- **Connection** → `profiles.user_id` = `auth.users.id`

