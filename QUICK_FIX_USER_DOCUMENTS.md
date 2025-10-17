# Quick Fix for user_documents Foreign Key Issue

## Problem

The error indicates that the `user_documents` table doesn't have the correct foreign key relationship with the `profiles` table.

## Solution

Run these SQL commands in your Supabase SQL Editor:

### Step 1: Fix the uploaded_by foreign key

```sql
-- Drop existing foreign key constraint on uploaded_by column
ALTER TABLE public.user_documents
DROP CONSTRAINT IF EXISTS user_documents_uploaded_by_fkey;

-- Add the correct foreign key constraint to reference profiles table
ALTER TABLE public.user_documents
ADD CONSTRAINT user_documents_uploaded_by_fkey
FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
```

### Step 2: Fix the user_id foreign key (if needed)

```sql
-- Drop existing foreign key constraint on user_id column
ALTER TABLE public.user_documents
DROP CONSTRAINT IF EXISTS user_documents_user_id_fkey;

-- Add the correct foreign key constraint for user_id to reference profiles table
ALTER TABLE public.user_documents
ADD CONSTRAINT user_documents_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
```

### Step 3: Verify the fix

```sql
-- Check that the foreign keys exist
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name='user_documents';
```

After running these commands, the user_documents query should work correctly.

## Alternative: Automated Setup

If you prefer to run all migrations at once, use:

```bash
./scripts/setup-database.sh
```
