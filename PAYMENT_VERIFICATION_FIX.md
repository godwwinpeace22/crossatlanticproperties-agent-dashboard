# Payment Verification Fix

## Problem

Users were encountering a `PGRST116` error during payment verification, indicating that the payment record could not be found in the database. This prevented users from completing the payment flow.

## Root Cause

There were multiple issues:

1. The payment record was being created but the verification endpoint couldn't find it (potentially due to RLS policies or timing issues)
2. The selected payment plan wasn't being stored with the payment record, so when users returned after payment, the system didn't know which plan they selected
3. No mechanism to auto-resume the workflow if users returned after payment

## Solutions Implemented

### 1. Added Defensive Checks in Verification API

**File**: `/app/api/payments/verify/route.ts`

- Added explicit check for payment record existence before attempting update
- Returns a clear 404 error if payment not found instead of generic 500 error
- Better error logging for debugging

### 2. Enhanced Payment Initialization API

**File**: `/app/api/payments/initialize/route.ts`

- Added `payment_plan` parameter to store selected payment plan with payment record
- Added console logging to track payment creation
- Improved error handling

### 3. Updated Database Schema

**File**: `/scripts/016_add_payment_plan_to_interest_payments.sql`

```sql
ALTER TABLE interest_payments
ADD COLUMN IF NOT EXISTS payment_plan JSONB;
```

This allows storing the selected payment plan (full, 30-30-40, or 25x4) with the payment record.

### 4. Updated TypeScript Types

**File**: `/lib/types.ts`

- Added `payment_plan?: PaymentPlan` field to `InterestPayment` interface

### 5. Enhanced Workflow Component

**File**: `/components/property-interest-workflow.tsx`

#### Added Auto-Resume Functionality

When the dialog reopens, the system now:

1. Checks if user has completed payment for this property
2. If payment exists but interest hasn't been submitted yet, automatically submits the interest
3. Shows a toast notification that payment was verified

#### New Function: `submitInterestAfterPayment`

```typescript
const submitInterestAfterPayment = async (payment: InterestPayment) => {
  // Submits property interest using payment record's payment_plan
  // Automatically called when returning user with successful payment detected
};
```

#### Updated `handleInitializePayment`

- Now sends `payment_plan` along with property details
- Ensures selected payment plan is stored in database

#### Added State Management

- Added `isSubmittingInterest` state to track interest submission
- Properly handles loading states during auto-submission

## Testing the Fix

### 1. Run the Migration

Execute the SQL migration to add the payment_plan column:

```bash
# In Supabase SQL Editor or via CLI
psql -U postgres -d your_database -f scripts/016_add_payment_plan_to_interest_payments.sql
```

### 2. Test Payment Flow

1. Open property interest workflow
2. Complete KYC if not already done
3. Select a payment plan (e.g., "3-Installment Plan")
4. Click "Pay ₦10,000"
5. Complete payment on Paystack
6. Return to the site

**Expected behavior:**

- Payment should be verified automatically
- Interest should be submitted automatically
- Success toast should appear
- Dialog should close

### 3. Test Resume Flow

1. Start payment flow but close browser after payment
2. Return to site later and click "Express Interest" again

**Expected behavior:**

- System should detect existing successful payment
- Automatically submit interest without requiring payment again
- Show "Payment Verified" toast

## Monitoring

Check these logs to verify the fix is working:

### Payment Initialization

```javascript
console.log("Payment record created successfully:", {
  payment_id,
  reference,
  user_id,
  payment_plan, // Should now appear
});
```

### Payment Verification

```javascript
console.log("Verifying payment for reference:", reference);
console.log("Existing payment found:", existingPayment);
```

## Potential Issues to Watch

1. **RLS Policies**: If verification still fails, check that RLS policies allow:

   - Users to read their own payment records
   - Service role can update payment records

2. **Timing**: If payment record isn't immediately available after creation, consider:

   - Adding a small delay before redirect
   - Implementing retry logic in verification

3. **Payment Plan Mismatch**: Ensure `payment_plan` value matches one of:
   - `"full"` - Full Payment
   - `"30-30-40"` - 3-Installment Plan
   - `"25x4"` - 4-Installment Plan

## Next Steps

1. ✅ Run database migration
2. ✅ Deploy updated code
3. Test payment flow end-to-end
4. Monitor logs for any remaining errors
5. Consider adding payment status dashboard for users

## Additional Improvements Considered

- Add webhook handler for Paystack to update payments in real-time
- Implement payment retry mechanism for failed payments
- Add payment expiration (auto-cancel pending payments after 24 hours)
- Send email notifications for successful payments
- Add admin tools to manually verify/refund payments
