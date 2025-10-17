# Database Setup Instructions

## Quick Setup

Run the SQL files in this exact order to avoid dependency errors:

### 1. Create the Updated At Function (Required First)

```sql
-- Run: scripts/000_create_updated_at_function.sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### 2. Terms Acceptances Table

```bash
# Run: scripts/010_create_terms_acceptances.sql
```

### 3. System Settings Table

```bash
# Run: scripts/011_create_system_settings.sql
```

### 4. User Documents Table

```bash
# Run: scripts/012_create_user_documents.sql
```

## Alternative: Automated Setup

Run the setup script:

```bash
cd /Users/mahintosh/dev/v0-multi-level-marketing-dashboard
./scripts/setup-database.sh
```

## Manual Supabase Setup

If using Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each SQL file content in the order listed above
4. Execute each one by clicking "Run"

## Verification

After setup, verify the tables exist:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('terms_acceptances', 'system_settings', 'user_documents');
```

## Troubleshooting

**Error: "function public.handle_updated_at() does not exist"**

- Make sure you run `000_create_updated_at_function.sql` first
- This function is required by all other tables

**Permission Errors**

- Ensure you have admin/owner access to the database
- Check that RLS policies don't conflict with your user role
