# How to View All Signed Up Users in Supabase

## 📧 Method 1: View Users via Supabase Dashboard (Easiest)

### Step-by-Step:

1. **Go to your Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Log in to your account
   - Select your project

2. **Navigate to Authentication → Users**
   - In the left sidebar, click **"Authentication"**
   - Click **"Users"** tab
   - You'll see a list of all signed-up users

3. **What You'll See:**
   - ✅ **Email addresses** - All user emails
   - ✅ **User IDs (UUID)** - Unique identifiers
   - ✅ **Created At** - Signup dates/times
   - ✅ **Email Confirmed** - Whether email is verified
   - ✅ **Last Sign In** - Last login time
   - ✅ **User Metadata** - Includes the name field we store

4. **Export Users (Optional):**
   - Click the **"Export"** button (if available)
   - Download as CSV/JSON

---

## 🗄️ Method 2: View Users via Database Table (More Details)

### Step-by-Step:

1. **Go to Table Editor**
   - In Supabase Dashboard, click **"Table Editor"** in left sidebar

2. **Check `auth.users` Table (Read-Only)**
   - You cannot directly edit this, but you can view it via SQL Editor
   - Go to **"SQL Editor"** → Create new query

3. **Run This SQL Query:**
   ```sql
   SELECT 
     id,
     email,
     email_confirmed_at,
     created_at,
     last_sign_in_at,
     raw_user_meta_data->>'name' as name_from_metadata
   FROM auth.users
   ORDER BY created_at DESC;
   ```

4. **This Will Show:**
   - All user IDs
   - All email addresses
   - Email confirmation status
   - Signup dates
   - Last sign-in dates
   - Name from metadata (if stored)

---

## 👤 Method 3: View Profiles Table (Check Who Has Profiles)

### Step-by-Step:

1. **Go to Table Editor**
   - Click **"Table Editor"** in left sidebar
   - Select **`profiles`** table

2. **What You'll See:**
   - All profile names
   - `user_id` - Links to auth.users
   - Created dates
   - Profile colors

3. **Check Which Users Don't Have Profiles:**
   - Go to **"SQL Editor"**
   - Run this query:

   ```sql
   -- Users who signed up but don't have profiles
   SELECT 
     u.id as user_id,
     u.email,
     u.created_at as signup_date,
     u.raw_user_meta_data->>'name' as name_from_signup
   FROM auth.users u
   LEFT JOIN profiles p ON p.user_id = u.id
   WHERE p.id IS NULL
   ORDER BY u.created_at DESC;
   ```

---

## 📊 Method 4: View Complete User + Profile Data

### SQL Query to Get Everything:

```sql
-- Complete view: Users with their profiles
SELECT 
   u.id as user_id,
   u.email,
   u.created_at as signup_date,
   u.email_confirmed_at,
   u.last_sign_in_at,
   u.raw_user_meta_data->>'name' as name_from_signup_metadata,
   p.id as profile_id,
   p.name as profile_name,
   p.created_at as profile_created_at,
   CASE 
     WHEN p.id IS NULL THEN 'No Profile'
     ELSE 'Has Profile'
   END as profile_status
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
ORDER BY u.created_at DESC;
```

This shows:
- ✅ All users who signed up
- ✅ Which ones have profiles
- ✅ Which ones are missing profiles
- ✅ Names from signup metadata
- ✅ Profile names (if created)

---

## 🔍 Method 5: Check via API (Programmatic Access)

You can also view users programmatically, but this requires admin access or using Supabase's Management API.

### Using Supabase Dashboard API:
1. Go to **Settings** → **API**
2. Use **Service Role Key** (keep this secret!)
3. Use Supabase Admin API to list users

---

## 📝 Quick Reference: What to Check

### To See All Signed Up Emails:
1. **Supabase Dashboard** → **Authentication** → **Users**
   - ✅ Simplest way
   - ✅ Shows all emails
   - ✅ Can export list

### To See Who Needs Profiles Created:
1. **SQL Editor** → Run the query from Method 3
   - ✅ Shows users without profiles
   - ✅ Shows their signup dates
   - ✅ Shows names from metadata

### To See Complete User Data:
1. **SQL Editor** → Run query from Method 4
   - ✅ Complete overview
   - ✅ Shows everything in one view

---

## 🎯 Common Tasks

### Task 1: "Find all emails that signed up"
**Answer:** Authentication → Users tab

### Task 2: "Find users who don't have profiles yet"
**Answer:** SQL Editor → Run Method 3 query

### Task 3: "Get a list of all user emails"
**Answer:** Authentication → Users → Export (or copy from table)

### Task 4: "See which users signed up before profile fix"
**Answer:** SQL Editor → Run Method 4 query, sort by `signup_date`, check which have `profile_status = 'No Profile'`

---

## 💡 Pro Tips

1. **Export Users List:**
   - In Authentication → Users
   - Look for export/download option
   - Or copy emails manually from the table

2. **Check Metadata:**
   - Click on a user in Authentication → Users
   - Scroll down to see "Raw User Meta Data"
   - Check if `name` field exists

3. **Filter by Date:**
   - In SQL Editor queries, add:
   ```sql
   WHERE created_at < '2024-01-15'  -- Before your fix date
   ```

4. **Count Users:**
   ```sql
   SELECT COUNT(*) as total_users FROM auth.users;
   SELECT COUNT(*) as users_with_profiles FROM profiles;
   ```

---

## 🚨 Important Notes

- **auth.users** table is read-only from your app
- **profiles** table is your custom table - you can edit it
- User passwords are **never visible** (they're hashed)
- Email addresses are visible in Authentication → Users

---

## ✅ Summary

**Easiest Way to View All Signups:**
1. Supabase Dashboard → Authentication → Users
2. See all emails, IDs, and signup dates
3. Export if needed

**To Check Which Users Need Profiles:**
1. SQL Editor → Run Method 3 query
2. See users without profiles
3. Their names might be in `raw_user_meta_data->>'name'`

