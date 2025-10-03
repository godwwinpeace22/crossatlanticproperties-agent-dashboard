# Payment Flow Update - Interest Creation

## Overview

Updated the payment flow so that property interest is created immediately during payment initialization with a `payment_pending` status, then automatically updated to `pending` when payment is successfully verified.

## Flow Diagram

```
User Clicks "Pay ₦10,000"
         ↓
POST /api/payments/initialize
         ↓
    Create payment record (status: pending)
         ↓
    Create property interest (status: payment_pending)
         ↓
    Redirect to Paystack
         ↓
    User completes payment
         ↓
    Return to /payment/verify
         ↓
GET /api/payments/verify
         ↓
    Update payment record (status: success)
         ↓
    Update interest record (status: pending)
         ↓
    Show success message
```

## Changes Made

### 1. Payment Initialization (`/app/api/payments/initialize/route.ts`)

**What it does now:**

- Creates payment record with `pending` status
- **NEW:** Immediately creates property interest with `payment_pending` status
- Links interest to payment via `interest_payment_id`
- Includes rollback logic if interest creation fails

**Key code:**

```typescript
// Create property interest with payment_pending status
const { data: interestRecord, error: interestError } = await supabase
  .from("property_interests")
  .insert({
    user_id: user.id,
    property_id,
    payment_plan: payment_plan || "full",
    interest_payment_id: paymentRecord.id,
    status: "payment_pending", // New status
  })
  .select()
  .single();
```

### 2. Payment Verification (`/app/api/payments/verify/route.ts`)

**What it does now:**

- Verifies payment with Paystack
- Updates payment record status
- **NEW:** Updates property interest status based on payment result:
  - If payment succeeds: `payment_pending` → `pending`
  - If payment fails: `payment_pending` → `payment_failed`

**Key code:**

```typescript
// Update property interest status based on payment result
if (paymentRecord.payment_status === "success") {
  await supabase
    .from("property_interests")
    .update({ status: "pending" })
    .eq("interest_payment_id", paymentRecord.id)
    .eq("status", "payment_pending");
} else if (paymentRecord.payment_status === "failed") {
  await supabase
    .from("property_interests")
    .update({ status: "payment_failed" })
    .eq("interest_payment_id", paymentRecord.id)
    .eq("status", "payment_pending");
}
```

### 3. Verification Page (`/app/payment/verify/page.tsx`)

**Updated messaging:**

- Changed title from "Payment Successful!" to "Interest Submitted Successfully!"
- Added confirmation checkmarks for both payment and interest submission
- Updated button text and messaging

### 4. Type Updates (`/lib/types.ts`)

**Added new statuses:**

```typescript
export type PropertyInterestStatus =
  | "payment_pending" // NEW: Waiting for payment
  | "payment_failed" // NEW: Payment failed
  | "pending" // Awaiting admin review
  | "approved"
  | "rejected"
  | "withdrawn"
  | "completed";
```

## Benefits

### 1. **Better Data Integrity**

- Interest and payment are created atomically
- No orphaned payments without interests
- Clear audit trail of the entire process

### 2. **Improved User Experience**

- Users immediately see their interest as "submitted" after payment
- No confusing intermediate steps
- Clear status progression

### 3. **Simpler Logic**

- No need for auto-submission checks in workflow component
- Single source of truth for interest status
- Easier to track and debug

### 4. **Admin Visibility**

- Admins can see interests that are awaiting payment (`payment_pending`)
- Can identify failed payments (`payment_failed`)
- Better reporting and analytics

## Status Flow

```
payment_pending  ←  Created during initialization
       ↓
   [Payment]
       ↓
   ┌───┴───┐
   ↓       ↓
pending  payment_failed
   ↓
[Admin Reviews]
   ↓
   ┌─────┼─────┐
   ↓     ↓     ↓
approved rejected withdrawn
   ↓
completed
```

## Testing Checklist

- [ ] User can initiate payment and interest is created with `payment_pending` status
- [ ] After successful payment, interest status changes to `pending`
- [ ] After failed payment, interest status changes to `payment_failed`
- [ ] Verification page shows correct success message
- [ ] Admin can see all interests regardless of payment status
- [ ] Rollback works if interest creation fails during initialization

## Database Considerations

### Existing Interests

Existing property interests without the new statuses will continue to work normally. The new statuses only apply to new interests created through the payment flow.

### Migration (Optional)

If you want to clean up any orphaned records:

```sql
-- Find interests in payment_pending status older than 24 hours
SELECT * FROM property_interests
WHERE status = 'payment_pending'
AND created_at < NOW() - INTERVAL '24 hours';

-- Optionally update them to payment_failed
UPDATE property_interests
SET status = 'payment_failed'
WHERE status = 'payment_pending'
AND created_at < NOW() - INTERVAL '24 hours';
```

## Next Steps

1. Test the complete payment flow
2. Update admin dashboard to handle new statuses
3. Consider adding email notifications for status changes
4. Add webhook handler for real-time payment updates
5. Implement retry mechanism for failed payments
