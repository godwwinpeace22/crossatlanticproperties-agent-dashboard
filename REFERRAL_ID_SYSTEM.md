# Referral ID System Implementation

## Overview

The system now uses a separate, user-friendly **8-character alphanumeric referral code** for each user instead of their full UUID. This makes it easier for agents to share their referral code with potential buyers.

## Changes Made

### 1. Database Schema Updates

**File**: `scripts/023_add_referral_id_to_profiles.sql`

#### Added Column

```sql
ALTER TABLE public.profiles
ADD COLUMN referral_id TEXT UNIQUE;
```

- **Type**: TEXT (8 characters, uppercase alphanumeric)
- **Unique**: Yes - ensures no duplicate referral codes
- **Indexed**: Yes - for fast lookups
- **Example**: `A3B7C9D2`

#### Generate Referral ID Function

```sql
CREATE OR REPLACE FUNCTION generate_referral_id()
RETURNS TEXT
```

- Generates unique 8-character uppercase code
- Uses MD5 hash of random + timestamp for uniqueness
- Checks for collisions and regenerates if needed
- Returns format: `[A-Z0-9]{8}`

#### Auto-Generate on Signup

Updated `handle_new_user()` trigger function to automatically generate referral_id when user signs up.

#### Lookup Function

```sql
CREATE OR REPLACE FUNCTION get_agent_by_referral_id(ref_id TEXT)
RETURNS UUID
```

- Looks up agent by referral code (case-insensitive)
- Returns agent's user ID
- Only returns agents (role = 'agent')

### 2. Frontend Updates

#### Updated Components

##### `app/dashboard/referrals/page.tsx`

- Fetches user's `referral_id` from profile
- Displays referral code instead of UUID
- Shows "Your Referral Code" instead of "Your Referral ID"
- Updated description to mention "code" instead of "ID"

**Before**:

```tsx
<p>{user.id}</p> // Long UUID: a3b7c9d2-1234-5678-90ab-cdef12345678
```

**After**:

```tsx
<p>{profile?.referral_id}</p> // Short code: A3B7C9D2
```

##### `app/dashboard/page.tsx`

- Fetches `referral_id` when loading profile
- Passes `referralCode` prop to MyReferralsCard
- Changed from `agentId={user.id}` to `referralCode={profile?.referral_id}`

##### `components/my-referrals-card.tsx`

- Changed prop from `agentId: string` to `referralCode: string`
- Updated display text from "Your Referral ID" to "Your Referral Code"
- Shows referral code in empty state
- More user-friendly display

##### `components/property-interest-workflow.tsx`

- Added automatic agent lookup when referral code entered
- Converts referral code to uppercase for consistency
- Queries database to find agent by referral_id
- Sets `referring_agent_id` automatically if agent found

**New Logic**:

```typescript
// Look up referring agent by referral code
let referringAgentId = null;
if (referralCode) {
  const { data: agent } = await supabase
    .from("profiles")
    .select("id")
    .eq("referral_id", referralCode.toUpperCase())
    .eq("role", "agent")
    .single();

  if (agent) {
    referringAgentId = agent.id;
  }
}

// Save both referral_code and referring_agent_id
await supabase.from("property_interests").insert({
  // ... other fields
  referral_code: referralCode ? referralCode.toUpperCase() : null,
  referring_agent_id: referringAgentId,
});
```

#### Updated Types

**File**: `lib/types.ts`

```typescript
export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  role: "admin" | "agent";
  is_active: boolean;
  referral_id?: string | null; // NEW: 8-character referral code
  created_at: string;
  updated_at: string;
}
```

## User Flow

### Agent Sharing Referral Code

1. **Agent logs in** → Dashboard loads
2. **Views "My Referrals" card** → Shows referral code (e.g., `A3B7C9D2`)
3. **Clicks "Copy ID"** button → Copies code to clipboard
4. **Shares code** with potential buyer via:
   - WhatsApp
   - Email
   - Phone call
   - Social media
   - In person

### Buyer Using Referral Code

1. **Buyer browses properties** on website
2. **Clicks "Express Interest"** on property
3. **Fills out interest form**
4. **Enters referral code** (e.g., `a3b7c9d2` or `A3B7C9D2`)
5. **System automatically**:

   - Converts to uppercase: `A3B7C9D2`
   - Looks up agent in database
   - Links interest to referring agent
   - Saves both `referral_code` and `referring_agent_id`

6. **Interest submitted** → Agent can now see it in "My Referrals"

### Commission Flow

1. Buyer makes installment payments
2. When all payments complete:
   - System creates `agent_hierarchy` record
   - Links buyer → referring agent
   - Calculates commissions for agent's upline
   - Disburses commissions

## Database Structure

### Profiles Table

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role TEXT,
  referral_id TEXT UNIQUE, -- NEW: 8-char code
  -- ... other fields
);

CREATE INDEX idx_profiles_referral_id ON profiles(referral_id);
```

### Property Interests Table

```sql
CREATE TABLE property_interests (
  id UUID PRIMARY KEY,
  user_id UUID,
  property_id UUID,
  referral_code TEXT,           -- The code entered by buyer
  referring_agent_id UUID,      -- The agent's user ID (looked up from code)
  -- ... other fields
);

CREATE INDEX idx_property_interests_referral_code
  ON property_interests(referral_code);

CREATE INDEX idx_property_interests_referring_agent
  ON property_interests(referring_agent_id);
```

## Benefits of Separate Referral ID

### 1. **User-Friendly**

- **Before**: Share 36-character UUID: `a3b7c9d2-1234-5678-90ab-cdef12345678`
- **After**: Share 8-character code: `A3B7C9D2`

### 2. **Easy to Communicate**

- Can be spoken over phone
- Easy to type in forms
- Less error-prone
- Memorable format

### 3. **Professional**

- Looks cleaner in marketing materials
- Easier to print on business cards
- Better for SMS/WhatsApp sharing

### 4. **Case-Insensitive**

- Buyers can enter lowercase: `a3b7c9d2`
- System converts to uppercase: `A3B7C9D2`
- Reduces input errors

### 5. **Secure**

- Not exposing internal user IDs
- Unique per user
- Can be regenerated if compromised

## Migration Steps

### For Existing Users

1. **Run Migration Script**

   ```sql
   -- Run scripts/023_add_referral_id_to_profiles.sql in Supabase
   ```

2. **Generate Codes for Existing Users**

   - Script automatically updates all existing profiles
   - Each user gets a unique 8-character code
   - Uses `generate_referral_id()` function

3. **No Action Required from Users**
   - Referral codes generated automatically
   - Users will see new code on next login
   - Old property interests still linked via `referring_agent_id`

### For New Users

- Referral code auto-generated on signup
- Trigger function creates code during user creation
- Ready to share immediately after registration

## Testing Checklist

### Database

- [ ] Run migration script in Supabase
- [ ] Verify all profiles have `referral_id`
- [ ] Check uniqueness constraint works
- [ ] Test `generate_referral_id()` function
- [ ] Test `get_agent_by_referral_id()` function

### Agent Dashboard

- [ ] Login as agent
- [ ] Verify referral code displays in dashboard
- [ ] Verify referral code displays in /dashboard/referrals
- [ ] Test "Copy ID" button
- [ ] Code should be 8 characters uppercase

### Property Interest Flow

- [ ] Enter referral code in property interest form
- [ ] Try lowercase code - should work
- [ ] Try uppercase code - should work
- [ ] Try invalid code - should not crash
- [ ] Submit interest with valid code
- [ ] Verify `referring_agent_id` is set correctly
- [ ] Verify interest appears in agent's referrals

### Commission Flow

- [ ] Complete all installment payments for referred interest
- [ ] Verify agent_hierarchy is created
- [ ] Verify commissions calculated
- [ ] Verify commissions appear in agent's dashboard

## API Endpoints

### Get User Profile with Referral Code

```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("*, referral_id")
  .eq("id", user.id)
  .single();
```

### Look Up Agent by Referral Code

```typescript
const { data: agent } = await supabase
  .from("profiles")
  .select("id")
  .eq("referral_id", referralCode.toUpperCase())
  .eq("role", "agent")
  .single();
```

### Create Property Interest with Referral

```typescript
const { data: interest } = await supabase.from("property_interests").insert({
  user_id: user.id,
  property_id: property.id,
  referral_code: referralCode.toUpperCase(),
  referring_agent_id: agent?.id || null,
  // ... other fields
});
```

## Future Enhancements

### 1. **Custom Referral Codes**

- Allow agents to create custom codes (e.g., `JOHN2024`)
- Check availability before allowing
- Premium feature for verified agents

### 2. **QR Code Generation**

- Generate QR code for each referral ID
- Agents can print and share QR codes
- Buyers scan to auto-fill referral code

### 3. **Referral Analytics**

- Track code usage over time
- Most popular channels (WhatsApp, email, etc.)
- Conversion rates per code

### 4. **Multiple Codes**

- Allow agents to create multiple codes
- Track which code works best
- Different codes for different campaigns

### 5. **Expirable Codes**

- Time-limited promotional codes
- Special event codes
- Campaign-specific tracking

### 6. **Vanity URLs**

- Create URLs like: `properties.com/ref/A3B7C9D2`
- Auto-populate referral code from URL
- Better for social media sharing

## Troubleshooting

### Referral Code Not Showing

**Problem**: Agent's dashboard shows "Loading..."

**Solution**:

1. Check if migration script ran: `SELECT referral_id FROM profiles LIMIT 1;`
2. Manually generate: `UPDATE profiles SET referral_id = generate_referral_id() WHERE referral_id IS NULL;`
3. Clear browser cache and reload

### Invalid Referral Code Error

**Problem**: Buyer enters code but interest not linked

**Solution**:

1. Verify code exists: `SELECT * FROM profiles WHERE referral_id = 'CODE';`
2. Check agent role: `SELECT role FROM profiles WHERE referral_id = 'CODE';`
3. Ensure case-insensitive lookup is working
4. Check browser console for errors

### Duplicate Code Error

**Problem**: Multiple users have same code

**Solution**:

1. Shouldn't happen due to UNIQUE constraint
2. If it does, regenerate: `UPDATE profiles SET referral_id = generate_referral_id() WHERE id = 'user-id';`
3. Check for database constraint issues

## Related Files

### Database

- `scripts/023_add_referral_id_to_profiles.sql` - Migration script
- `scripts/001_create_profiles.sql` - Original profiles table
- `scripts/017_create_property_interests.sql` - Property interests table

### Frontend Components

- `components/my-referrals-card.tsx` - Dashboard widget
- `app/dashboard/referrals/page.tsx` - Full referrals page
- `app/dashboard/page.tsx` - Main dashboard
- `components/property-interest-workflow.tsx` - Interest submission form

### Types & Utilities

- `lib/types.ts` - TypeScript interfaces
- `lib/format.ts` - Formatting utilities

## Summary

✅ **Implemented separate 8-character referral codes**
✅ **Auto-generated on user signup**
✅ **Case-insensitive lookup**
✅ **Updated all UI to use new codes**
✅ **Automatic agent linking on interest submission**
✅ **Backward compatible with existing data**
✅ **Indexed for fast lookups**
✅ **Unique constraint prevents duplicates**

The referral system is now much more user-friendly while maintaining all the same functionality for commission tracking and network building!
