# Quick Migration Guide: Referral ID System

## What Changed?

Users now have a separate **8-character referral code** (e.g., `A3B7C9D2`) instead of using their full UUID for referrals.

## How to Deploy

### Step 1: Run Database Migration

In your Supabase SQL Editor, run:

```sql
-- Copy and paste the entire contents of:
-- scripts/023_add_referral_id_to_profiles.sql
```

This will:

- ✅ Add `referral_id` column to profiles
- ✅ Generate codes for all existing users
- ✅ Create lookup functions
- ✅ Update signup trigger

### Step 2: Deploy Frontend Changes

No special deployment steps needed. Just deploy normally:

```bash
# If using Vercel/similar
git push origin main

# Or build locally
npm run build
```

### Step 3: Verify Migration

#### Check Database

```sql
-- All users should have referral_id
SELECT id, email, referral_id FROM profiles LIMIT 10;

-- Should return 0 rows
SELECT COUNT(*) FROM profiles WHERE referral_id IS NULL;

-- Check for uniqueness
SELECT referral_id, COUNT(*)
FROM profiles
GROUP BY referral_id
HAVING COUNT(*) > 1;
```

#### Check Frontend

1. Login as an agent
2. Go to Dashboard → Should see 8-character code
3. Go to "My Referrals" page → Should see same code
4. Try to copy code → Should work

#### Test Referral Flow

1. Logout
2. Browse to a property
3. Click "Express Interest"
4. Enter an agent's referral code (get from step 2)
5. Submit interest
6. Login as that agent
7. Check "My Referrals" → Should see the new interest

## Breaking Changes

**None!** This is backward compatible:

- Old property interests still work (have `referring_agent_id`)
- New interests automatically link to agents via code lookup
- No data loss

## Rollback Plan

If something goes wrong:

```sql
-- Remove the column (data preserved in referring_agent_id)
ALTER TABLE profiles DROP COLUMN IF EXISTS referral_id;

-- Drop the functions
DROP FUNCTION IF EXISTS generate_referral_id();
DROP FUNCTION IF EXISTS get_agent_by_referral_id(TEXT);
```

Then redeploy previous frontend version.

## Need Help?

Check `REFERRAL_ID_SYSTEM.md` for full documentation.
