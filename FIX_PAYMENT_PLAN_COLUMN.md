# Fix: Payment Plan Column Name Mismatch

## Issue

The payment initialization was failing with error:

```
Could not find the 'payment_plan' column of 'property_interests' in the schema cache
```

## Root Cause

The database column is named `selected_payment_plan` but the API was trying to insert into `payment_plan`.

## Files Fixed

### 1. `/app/api/payments/initialize/route.ts`

**Changed:**

```typescript
// Before
payment_plan: payment_plan || "full",

// After
selected_payment_plan: payment_plan || "full",
```

### 2. `/components/property-interest-workflow.tsx`

**Changed:**

```typescript
// Before
payment_plan: payment.payment_plan || selectedPaymentPlan,

// After
selected_payment_plan: payment.payment_plan || selectedPaymentPlan,
```

### 3. `/scripts/020_add_payment_statuses_to_interests.sql`

**Created migration to add new statuses:**

- `payment_pending` - Interest created, awaiting payment
- `payment_failed` - Payment failed or was not completed

## Database Migration Required

Run this SQL in your Supabase SQL editor:

```sql
-- Add payment_pending and payment_failed statuses to property_interests
ALTER TABLE public.property_interests
DROP CONSTRAINT IF EXISTS property_interests_status_check;

ALTER TABLE public.property_interests
ADD CONSTRAINT property_interests_status_check
CHECK (status IN ('payment_pending', 'payment_failed', 'pending', 'approved', 'rejected', 'withdrawn', 'completed'));
```

## Testing

After applying the fix and running the migration:

1. Navigate to a property page
2. Click "Express Interest"
3. Complete KYC if needed
4. Select a payment plan
5. Click "Pay ₦10,000"
6. Check the logs - should show:
   ```
   Payment record created successfully
   Property interest created with payment_pending status
   ```
7. Complete payment on Paystack
8. Return to verify page
9. Interest status should update from `payment_pending` to `pending`

## Status Flow After Fix

```
Initialization:
  ✓ Create payment (status: pending)
  ✓ Create interest (status: payment_pending, selected_payment_plan: "full" | "30-30-40" | "25x4")
  ✓ Redirect to Paystack

Verification:
  ✓ Update payment (status: success | failed)
  ✓ Update interest (status: pending | payment_failed)
```
