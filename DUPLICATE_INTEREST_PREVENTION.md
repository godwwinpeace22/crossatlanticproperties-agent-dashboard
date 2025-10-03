# Duplicate Interest Prevention System

## Overview

Multi-layer protection system to prevent users from submitting interest for the same property multiple times.

## Protection Layers

### 1. Database Level (Primary Protection)

**File:** `/scripts/017_create_property_interests.sql`

**Constraint:**

```sql
UNIQUE(user_id, property_id)
```

**What it does:**

- Enforces uniqueness at the database level
- PostgreSQL will reject any INSERT that violates this constraint
- Returns error code `23505` (unique_violation)
- **Most reliable** protection as it cannot be bypassed

**Error when violated:**

```
duplicate key value violates unique constraint "property_interests_user_id_property_id_key"
```

### 2. API Level (Secondary Protection)

**File:** `/app/api/payments/initialize/route.ts`

**Check added:**

```typescript
// Check if user already has an interest for this property
const { data: existingInterest } = await supabase
  .from("property_interests")
  .select("id, status")
  .eq("user_id", user.id)
  .eq("property_id", property_id)
  .single();

if (existingInterest) {
  return NextResponse.json(
    {
      error: "You have already submitted interest for this property",
      details: {
        interest_id: existingInterest.id,
        status: existingInterest.status,
      },
    },
    { status: 409 } // Conflict
  );
}
```

**Benefits:**

- Prevents unnecessary payment initialization
- User doesn't pay for a duplicate interest
- Returns clear error message before Paystack redirect
- HTTP 409 (Conflict) status indicates duplicate

### 3. UI Level (Tertiary Protection)

**File:** `/components/property-interest-workflow.tsx`

**Check added in `checkAuthAndKYCStatus`:**

```typescript
// Check if user already has an interest for this property
const { data: existingInterest } = await supabase
  .from("property_interests")
  .select("id, status")
  .eq("user_id", user.id)
  .eq("property_id", property.id)
  .single();

if (existingInterest) {
  toast({
    title: "Interest Already Submitted",
    description: `You have already expressed interest in this property. Status: ${existingInterest.status}`,
    variant: "destructive",
  });
  setIsLoading(false);
  onClose();
  return;
}
```

**Benefits:**

- Friendly user experience
- Shows current status of existing interest
- Prevents dialog from opening unnecessarily
- User sees immediate feedback

## Flow Diagram

```
User clicks "Express Interest"
         ↓
UI Check: Does interest exist?
    ↓ Yes → Show toast, close dialog ✋
    ↓ No
Continue to KYC/Payment selection
         ↓
User clicks "Pay ₦10,000"
         ↓
API Check: Does interest exist?
    ↓ Yes → Return 409 error ✋
    ↓ No
Initialize payment
         ↓
Database Insert: Create interest
    ↓ Conflict → Unique constraint violation ✋
    ↓ Success
Redirect to Paystack
```

## Status Considerations

Users might try to submit interest again if their first attempt:

- Failed payment (`payment_failed`)
- Was rejected by admin (`rejected`)
- Was withdrawn (`withdrawn`)

### Handling Different Statuses

#### Option A: Strict (Current Implementation)

**Never allow duplicates, regardless of status**

Pros:

- Simplest to implement
- Clear audit trail
- One interest per property per user

Cons:

- User with rejected interest can't reapply
- Failed payments block future attempts

#### Option B: Allow Resubmission for Failed/Rejected

**Modify the check to allow specific statuses:**

```typescript
// Only block if interest is active
const { data: activeInterest } = await supabase
  .from("property_interests")
  .select("id, status")
  .eq("user_id", user.id)
  .eq("property_id", property_id)
  .not("status", "in", "(payment_failed,rejected,withdrawn)")
  .single();

if (activeInterest) {
  // Block duplicate
}
```

This would allow users to:

- ✅ Retry after payment failure
- ✅ Reapply after rejection
- ✅ Submit again after withdrawal
- ❌ Submit if pending, payment_pending, approved, or completed

## Recommended Approach

### Short Term (Current)

Keep strict uniqueness constraint. For edge cases:

- Admin can manually delete failed/rejected interests
- Admin can change status to allow resubmission

### Long Term (Future Enhancement)

- Add "Retry Payment" button for `payment_failed` interests
- Add "Reapply" flow for `rejected` interests (updates existing record)
- Track submission attempts in a separate table
- Add "Cancel" button for `payment_pending` interests

## Testing

### Test Case 1: Happy Path

1. User expresses interest
2. Pays successfully
3. Interest created with `pending` status
   ✅ Expected: Success

### Test Case 2: Double Click

1. User clicks "Express Interest"
2. While loading, clicks again
3. Second request arrives
   ✅ Expected: UI check catches it, only one interest created

### Test Case 3: Browser Back Button

1. User completes payment
2. Uses browser back button
3. Clicks "Pay ₦10,000" again
   ✅ Expected: API check catches it, returns 409 error

### Test Case 4: Direct API Call

1. Malicious user calls API directly
2. Tries to create duplicate interest
   ✅ Expected: Database constraint catches it, returns error

### Test Case 5: Race Condition

1. Two simultaneous requests from same user
2. Both pass API check at same time
3. Both try to insert
   ✅ Expected: Database constraint catches second insert

## Monitoring

### Logs to Watch

```javascript
// In API initialization
console.log("Duplicate interest attempt blocked:", {
  user_id,
  property_id,
  existing_interest_id,
  existing_status,
});
```

### Metrics to Track

- Number of 409 errors (duplicate attempts)
- Time between interest creation and duplicate attempt
- Which statuses have the most retry attempts

## Admin Tools Needed

1. **View User's Interest History**

   - Show all interests (including failed/rejected)
   - Allow manual deletion if needed

2. **Reset Interest**

   - Change status to allow resubmission
   - Or delete and let user start fresh

3. **Merge Duplicate Interests**
   - If somehow duplicates were created
   - Admin can merge or delete extras

## Future Enhancements

1. **Add "reason" field** to track why interest was rejected
2. **Add "resubmission_count"** to track retry attempts
3. **Email notifications** when status changes
4. **User dashboard** showing all their interests and statuses
5. **Withdraw button** for pending interests
6. **Edit payment plan** for payment_pending interests

## Migration (If Needed)

If you want to clean up any existing duplicates:

```sql
-- Find duplicates (shouldn't exist due to constraint)
SELECT user_id, property_id, COUNT(*) as count
FROM property_interests
GROUP BY user_id, property_id
HAVING COUNT(*) > 1;

-- Keep the earliest interest, delete others (if any found)
DELETE FROM property_interests a
USING property_interests b
WHERE a.user_id = b.user_id
  AND a.property_id = b.property_id
  AND a.created_at > b.created_at;
```
