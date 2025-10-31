# Database Setup Instructions

## 🗄️ Database Setup for Deen Tracker

### **Step 1: Choose Your Database Provider**

You have several options for setting up the database:

#### **Option A: Supabase (Recommended - Free Tier Available)**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy your database URL and anon key
5. Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### **Option B: PostgreSQL (Local/Cloud)**
1. Install PostgreSQL locally or use a cloud provider (AWS RDS, Google Cloud SQL, etc.)
2. Create a database named `deen_tracker`
3. Create a `.env.local` file:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/deen_tracker
```

#### **Option C: Other Database Providers**
- **Neon** (PostgreSQL): [neon.tech](https://neon.tech)
- **PlanetScale** (MySQL): [planetscale.com](https://planetscale.com)
- **Railway** (PostgreSQL): [railway.app](https://railway.app)

### **Step 2: Run Database Schema**

#### **For Supabase:**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `database-schema.sql`
4. Click "Run" to execute the schema

#### **For PostgreSQL (Local/Other):**
```bash
# Connect to your database
psql -h localhost -U your_username -d deen_tracker

# Run the schema file
\i database-schema.sql
```

### **Step 3: Verify Setup**

After running the schema, you should have these tables:
- ✅ `profiles` - User profiles
- ✅ `entries` - Daily prayer/dhikr entries
- ✅ `quran_progress` - Quran reading progress
- ✅ `dhikr_progress` - Dhikr counts
- ✅ `prayer_times` - Cached prayer times
- ✅ `qibla_directions` - Cached Qibla directions
- ✅ `islamic_events` - Islamic calendar events
- ✅ `fasting_records` - Fasting records
- ✅ `daily_analytics` - Daily analytics summary
- ✅ `streaks` - Streak tracking
- ✅ `goals` - Goals and targets
- ✅ `achievements` - Achievement badges

### **Step 4: Test the Connection**

1. Start your development server:
```bash
npm run dev
```

2. Open your browser to `http://localhost:3000`
3. Try adding a profile and some entries
4. Check the analytics section to see if data is being stored

### **Step 5: Sample Data (Optional)**

If you want to populate the database with sample data for testing:

```sql
-- Insert sample profiles
INSERT INTO profiles (name, color) VALUES 
('Oj', '#3b82f6'),
('Ayesh', '#16a34a'),
('Test User', '#f59e0b');

-- Insert sample Islamic events
INSERT INTO islamic_events (hijri_date, event_name, event_type, description) VALUES
('9-1', 'First day of Ramadan', 'fasting', 'Beginning of the holy month of Ramadan'),
('9-27', 'Laylat al-Qadr', 'special', 'Night of Power'),
('10-1', 'Eid al-Fitr', 'holiday', 'Festival of Breaking the Fast');
```

## 🔧 Troubleshooting

### **Common Issues:**

1. **"Table doesn't exist" errors:**
   - Make sure you ran the complete `database-schema.sql` file
   - Check that you're connected to the correct database

2. **Permission errors:**
   - Ensure your database user has CREATE, INSERT, UPDATE, DELETE permissions
   - For Supabase, make sure RLS policies are set up correctly

3. **Connection errors:**
   - Verify your `.env.local` file has the correct database URL
   - Check that your database server is running
   - Ensure firewall/network settings allow connections

4. **Supabase specific:**
   - Make sure you're using the correct project URL and anon key
   - Check that RLS (Row Level Security) is enabled on tables
   - Verify the policies are set up for public access (for MVP)

### **Environment Variables:**

Create a `.env.local` file in your project root with:

```env
# Supabase (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Or PostgreSQL (if using direct PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database_name
```

## 📊 Database Features

### **Automatic Features:**
- ✅ **Daily Analytics**: Automatically calculated when entries are added
- ✅ **Streak Tracking**: Automatically updated based on daily activities
- ✅ **Achievement Detection**: Automatically awarded based on progress
- ✅ **Data Validation**: Built-in constraints and triggers

### **Performance Optimizations:**
- ✅ **Indexes**: Optimized for common queries
- ✅ **Caching**: Prayer times and Qibla directions are cached
- ✅ **Views**: Pre-built views for complex queries
- ✅ **Functions**: Helper functions for calculations

### **Data Integrity:**
- ✅ **Foreign Keys**: Proper relationships between tables
- ✅ **Unique Constraints**: Prevent duplicate entries
- ✅ **Triggers**: Automatic updates and calculations
- ✅ **Row Level Security**: Data protection (Supabase)

## 🚀 Next Steps

Once your database is set up:

1. **Test the application** - Add profiles, entries, and check analytics
2. **Customize** - Modify the schema if needed for your specific requirements
3. **Backup** - Set up regular database backups
4. **Monitor** - Use your database provider's monitoring tools
5. **Scale** - Consider connection pooling for production use

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify your database connection
3. Check the browser console for errors
4. Review the API logs in your terminal

The application will now use real database data instead of dummy data for all features including analytics, Islamic features, and progress tracking!
