# Referrals Feature Update

## Changes Made

### 1. Updated Referrals Page Design

**File**: `app/dashboard/referrals/page.tsx`

#### Previous Design

- Showed referrals in a table format
- Only displayed basic information (customer, property, value, payment plan, date, status)
- No visibility into payment schedules

#### New Design

- Uses `PropertyPaymentCard` component to show each referral
- Displays full payment schedule with expandable details
- Shows customer name above each property card
- 5 statistics cards instead of 4:
  - Total Referrals
  - Total Property Value
  - **Total Paid** (NEW - shows total installment payments received)
  - **Overdue** (NEW - shows count of late payments)
  - Commissions Earned

#### Key Features

- **Payment Tracking**: Agents can see the payment progress of each referred property interest
- **Customer Attribution**: Each property card shows who the referral is (customer name/email)
- **Expandable Details**: Click to expand and see:
  - Individual installment payments
  - Payment status (Paid, Pending, Under Review, Overdue)
  - Due dates and paid dates
  - Upload payment proof button (if not already paid)
- **Progress Visualization**: Circular progress indicator showing % of payments completed

### 2. Fixed Referral ID Display

**Files**:

- `app/dashboard/referrals/page.tsx`
- `components/my-referrals-card.tsx`

#### Issue

- Referral ID was showing only first 8 characters: `user.id.slice(0, 8)`
- This created confusion about what the actual referral ID was

#### Fix

- Now shows the **full user ID** (UUID)
- Added `break-all` class to handle long ID display
- Consistent across dashboard card and referrals page

#### Why Full ID?

- The database uses the full UUID in `referring_agent_id` field
- Buyers need to enter the complete ID when submitting property interest
- Prevents confusion and errors in referral tracking

### 3. Updated Statistics

#### New Metrics Added

1. **Total Paid**: Sum of all paid installment payments across all referrals
2. **Overdue**: Count of pending payments past their due date

#### Calculation Logic

```typescript
// Total paid from all installment payments
const totalPaid =
  allPayments
    ?.filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

// Count overdue payments
const overduePayments =
  allPayments?.filter(
    (p) => p.status === "pending" && new Date(p.due_date) < new Date()
  ).length || 0;
```

## Database Queries

### Fetch Referrals with Property Details

```typescript
const { data: referrals } = await supabase
  .from("property_interests")
  .select(
    `
    *,
    profiles:profiles!property_interests_user_id_fkey(full_name, email),
    property:properties(name, price, city, category)
  `
  )
  .eq("referring_agent_id", user.id)
  .order("created_at", { ascending: false });
```

### Fetch All Installment Payments for Referrals

```typescript
const { data: allPayments } = await supabase
  .from("installment_payments")
  .select("*")
  .in("property_interest_id", referrals?.map((r) => r.id) || [])
  .order("due_date", { ascending: true });
```

### Group Payments by Referral

```typescript
const paymentsByReferral = (referrals || []).map((referral) => ({
  referral,
  payments:
    allPayments?.filter((p) => p.property_interest_id === referral.id) || [],
}));
```

## UI Components Used

### PropertyPaymentCard

**Purpose**: Display property with expandable payment schedule

**Features**:

- Header showing property name, location, category
- Progress circle (% of payments completed)
- Expandable payment schedule
- Individual installment rows with:
  - Installment number badge
  - Status badge (Paid, Pending, Overdue, Under Review)
  - Due date and paid date
  - Amount
  - Upload proof button

**Why This Component?**

- Already built and tested for `my-interests` page
- Provides rich payment tracking UI
- Handles payment proof uploads
- Shows visual progress indicators

## User Experience Flow

### Agent Views Referrals Page

1. **See Statistics Dashboard**

   - Quick overview of all referral metrics
   - Total value, payments received, overdue count

2. **Copy Referral ID**

   - Full UUID displayed in copyable format
   - Share with potential buyers

3. **View Each Referral's Payment Progress**

   - See customer name and submission date
   - Expand to view full payment schedule
   - Track which installments are paid/pending/overdue

4. **Monitor Payment Status**
   - Identify overdue payments
   - See which customers are up-to-date
   - Track total amount received from referrals

### Benefits for Agents

1. **Transparency**: Full visibility into referral payment progress
2. **Accountability**: Can follow up with late-paying referrals
3. **Motivation**: See payments being made on referred properties
4. **Commission Tracking**: Understand when commissions will be earned

## Comparison: Before vs After

| Aspect            | Before                 | After                               |
| ----------------- | ---------------------- | ----------------------------------- |
| **View**          | Table                  | Property Cards                      |
| **Payment Info**  | Payment plan name only | Full payment schedule               |
| **Progress**      | Not visible            | Circular progress indicator         |
| **Installments**  | Not shown              | Individual rows with status         |
| **Referral ID**   | First 8 chars          | Full UUID                           |
| **Statistics**    | 4 cards                | 5 cards (added Total Paid, Overdue) |
| **Expandable**    | No                     | Yes - click to see details          |
| **Customer Info** | In table cell          | Header above each card              |

## Testing Checklist

- [ ] Referrals page loads without errors
- [ ] PropertyPaymentCard displays for each referral
- [ ] Customer name appears above each card
- [ ] Full referral ID is displayed (not truncated)
- [ ] Copy button works for referral ID
- [ ] Statistics are calculated correctly
- [ ] Total Paid shows sum of paid installments
- [ ] Overdue count matches pending payments past due date
- [ ] Cards expand to show payment schedule
- [ ] Progress circle shows correct percentage
- [ ] Empty state appears when no referrals
- [ ] Payment status badges display correctly

## Related Files

- `/app/dashboard/referrals/page.tsx` - Referrals page (UPDATED)
- `/components/my-referrals-card.tsx` - Dashboard widget (UPDATED - referral ID fix)
- `/components/property-payment-card.tsx` - Payment card component (REUSED)
- `/app/dashboard/my-interests/page.tsx` - Similar page using PropertyPaymentCard

## Future Enhancements

1. **Real-time Updates**: Add SWR/React Query for live payment status updates
2. **Notifications**: Alert agent when referral makes a payment
3. **Filters**: Filter by payment status, overdue, completed
4. **Export**: Download referral payment report as CSV
5. **Payment Reminders**: Send automatic reminders to referrals with overdue payments
6. **Commission Projection**: Show estimated commissions based on payment progress

## Summary

✅ **Agents can now see property interests AND their payment schedules**
✅ **Full referral ID displayed consistently**
✅ **Enhanced statistics with payment tracking**
✅ **Reused existing PropertyPaymentCard component for consistency**
✅ **Better visibility into referral payment behavior**

The referrals feature now provides complete transparency into the payment journey of referred customers, helping agents stay informed and engaged with their referral network.
