# Property Interest Approval Workflow

## Complete Flow Explanation

### 1. User Submits Interest

**Steps:**

1. User clicks "Express Interest" on a property
2. System checks if KYC is approved (required)
3. User selects payment plan (Full, 50-50, 25% quarterly, etc.)
4. User pays ₦10,000 application fee via Paystack
5. **Property interest created with status**: `payment_pending`
6. After payment verification: Status changes to `pending`

**Code:** `/app/api/payments/initialize/route.ts` (creates interest immediately with payment)

### 2. Admin Reviews Interest

**Where:** `/dashboard/admin/property-interests`

**What Admin Sees:**

- List of all property interests
- User details (name, email, KYC status)
- Property details
- Selected payment plan
- Current status

**Admin Actions:**

1. Click on an interest to view details
2. Review:
   - User's KYC submission status
   - Selected payment plan
   - Property details
3. Make decision:
   - **Approve**: Creates installment schedule
   - **Reject**: Interest marked as rejected with reason

### 3. What Happens on Approval

**Automatic Actions When Admin Approves:**

1. **Interest status** → `approved`
2. **Installment payments created** based on payment plan:

   - **Full Payment**: 1 installment (100% due in 30 days)
   - **50-50 Split**: 2 installments (50% each, 30 days apart)
   - **25% Quarterly**: 4 installments (25% each, 30 days apart)

3. **Notification sent** to user:

   ```
   "Your interest in [Property Name] has been approved.
   Your payment schedule has been created."
   ```

4. **User can now see**:
   - Their approved interest on dashboard
   - Payment schedule with due dates
   - Option to upload payment proofs

**Code:** `/components/property-interests-list.tsx` lines 126-131

```typescript
// If approved, create installment payments
if (newStatus === "approved") {
  const interest = interests.find((i) => i.id === interestId);
  if (interest) {
    await createInstallmentSchedule(interestId, interest);
  }
}
```

### 4. User Makes Installment Payments

**After Approval:**

1. User sees payment schedule on `/dashboard/my-interests`
2. For each installment, user:
   - Makes payment to company bank account
   - Uploads payment proof (receipt/screenshot)
   - Status changes to `pending_verification`
3. Admin reviews and approves each payment
4. Once ALL installments are paid:
   - Interest status → `completed`
   - Agent hierarchy created (if referred)
   - Commissions disbursed

## Why Your Interest Isn't Showing on Dashboard

### Issue Identified

The dashboard query for pending payments was incorrect. It was trying to filter by `property_interest.user_id` without properly joining the tables.

### Fix Applied

Updated `/app/dashboard/page.tsx` line 238-243:

**Before (Broken):**

```typescript
supabase
  .from("installment_payments")
  .select("*", { count: "exact", head: true })
  .eq("property_interest.user_id", user.id) // ❌ Can't filter on relation without join
  .eq("status", "pending");
```

**After (Fixed):**

```typescript
supabase
  .from("installment_payments")
  .select(
    `
    *,
    property_interest:property_interests!inner(user_id)  // ✅ Proper join
  `,
    { count: "exact" }
  )
  .eq("property_interest.user_id", user.id)
  .eq("status", "pending");
```

## Navigation to Admin Approval Page

Admins can access property interests via:

**Dashboard Navigation:**

- `/dashboard/admin/property-interests` - List all interests
- `/dashboard/admin/property-interests/[id]` - View specific interest details

**Should be in sidebar navigation for admins**

## Current Status Flow

```
payment_pending → pending → approved → completed
                     ↓
                 rejected
```

**Status Meanings:**

- `payment_pending`: Application fee not yet paid
- `payment_failed`: Application fee payment failed
- `pending`: Awaiting admin review (fee paid)
- `approved`: Admin approved, installments created
- `rejected`: Admin rejected with reason
- `withdrawn`: User cancelled
- `completed`: All installment payments made and approved

## Admin Approval Is NOT Automatic

**To answer your question directly:**

> "There is no way for admin to approve interest, or is it approved automatically after payment is verified?"

❌ **NOT automatic** - Admin must manually review and approve each interest

✅ **Manual approval required** at `/dashboard/admin/property-interests`

The payment verification only changes status from `payment_pending` to `pending`. Admin approval is a separate manual step that triggers installment schedule creation.

## Recommendations

### 1. Check if Admin Navigation Includes Property Interests Link

Verify `/components/dashboard-nav.tsx` has:

```typescript
{
  title: "Interests",
  href: "/dashboard/admin/property-interests",
  icon: Heart,
}
```

### 2. Test the Complete Flow

1. Create a test interest with your account
2. Pay the application fee
3. Log in as admin
4. Navigate to Property Interests
5. Approve the interest
6. Check if installments are created
7. Verify it appears on your agent dashboard

### 3. Check RLS Policies

Ensure agents can view their own property interests:

```sql
-- Check if this policy exists
SELECT * FROM pg_policies
WHERE tablename = 'property_interests'
AND policyname LIKE '%agent%';
```

## Next Steps

1. ✅ **Fixed**: Dashboard query for pending payments
2. ⚠️ **Check**: Admin navigation includes Property Interests link
3. ⚠️ **Verify**: RLS policies allow agents to see their interests
4. ⚠️ **Test**: Complete flow from interest → payment → approval → dashboard display
