# Commission Disbursement Implementation

## Overview

Commission disbursement has been implemented in the payment approval system. When an admin approves a payment and all installment payments for a property interest are completed, commissions are automatically disbursed to the referring agent's upline chain.

## How It Works

### 1. Payment Approval Flow

- Admin reviews installment payment with status `pending_verification`
- Admin clicks "Approve" button
- Payment status is updated to `paid`
- System checks if all payments for this property interest are complete

### 2. Commission Disbursement Trigger

When the last payment is approved:

1. **All Payments Check**: System verifies all installment payments have status `paid`
2. **Duplicate Check**: Ensures commissions haven't been disbursed already
3. **Status Update**: Property interest status is updated to `completed`
4. **Agent Hierarchy Creation**: Creates relationship between buyer and referring agent (buyer becomes agent under referring agent)
5. **Commission Calculation**: Commissions are calculated based on upline chain

### 3. Commission Calculation Logic

The system follows the same logic as in `approvals-list.tsx`:

- **Get Upline Chain**: Traverses the `agent_hierarchy` table up to 5 levels
- **Commission Settings**: Uses percentages from `commission_settings` table
- **Create Records**: Inserts commission records in the `commissions` table

Example:

```
Property Price: $100,000
Level 1 (Direct Referrer): 5% = $5,000
Level 2 (Upline): 3% = $3,000
Level 3 (Upline): 2% = $2,000
... up to 5 levels
```

## Database Changes

### New Migration Script

**File**: `scripts/022_add_property_interest_to_commissions.sql`

**Changes**:

1. Adds `property_interest_id` column to `commissions` table
2. Makes `purchase_id` nullable (was previously required)
3. Adds check constraint: either `purchase_id` OR `property_interest_id` must be set
4. Adds index for better query performance

**Why This Change?**

- Original system required a `purchase` record for commissions
- New installment payment system doesn't create purchases upfront
- Now commissions can be linked directly to property interests
- Maintains backward compatibility with existing purchase-based commissions

### To Apply Migration

Run this SQL in your Supabase SQL Editor:

```bash
-- Apply the migration
\i scripts/022_add_property_interest_to_commissions.sql
```

Or copy and paste the SQL directly into Supabase dashboard.

## Code Changes

### Updated Component: `components/payment-approval-list.tsx`

#### New Functions Added:

1. **`checkAndDisburseCommissions()`**

   - Fetches property interest with referring agent and property details
   - Retrieves all installment payments
   - Checks if all payments are completed (`paid` status)
   - Prevents duplicate commission disbursement
   - Updates property interest status to `completed`
   - **Creates agent hierarchy relationship (buyer becomes agent under referring agent)**
   - Triggers commission calculation

2. **`createAgentHierarchy()`**

   - Checks if hierarchy relationship already exists
   - Creates agent_hierarchy record linking buyer to referring agent
   - Sets buyer as agent with referring agent as upline (Level 1)
   - Auto-approves the relationship
   - Logs creation for debugging

3. **`calculateCommissions()`**

   - Fetches commission settings from database
   - Gets upline chain for the referring agent
   - Creates commission records for each level
   - Uses property price as the commission base amount

4. **`getUplineChain()`**
   - Traverses agent hierarchy table
   - Finds approved upline agents (up to 5 levels)
   - Returns array of upline agent IDs

#### Modified Function:

**`handleConfirm()`**

- Added call to `checkAndDisburseCommissions()` after approving payment
- Only triggers on approval (not rejection)

## Key Features

### ✅ Automatic Disbursement

- No manual intervention needed after payment approval
- Commissions are created automatically when all payments complete

### ✅ Idempotent

- Checks for existing commissions before creating new ones
- Safe to approve payments multiple times (won't create duplicates)

### ✅ Multi-Level Support

- Supports up to 5 levels of upline agents
- Follows agent hierarchy relationships
- Uses configurable commission percentages

### ✅ Error Handling

- Console logging for debugging
- Graceful failure (won't block payment approval)
- Doesn't throw errors that would stop the approval process

## Testing Checklist

### Before Testing

- [ ] Run migration script `022_add_property_interest_to_commissions.sql`
- [ ] Ensure `commission_settings` table has level configurations
- [ ] Verify `agent_hierarchy` relationships exist

### Test Scenario 1: Single Payment Approval

1. Create property interest with 1 installment
2. User uploads payment proof
3. Admin approves payment
4. **Expected**: Commission records created immediately

### Test Scenario 2: Multiple Payment Approval

1. Create property interest with 3 installments
2. User uploads proof for installment #1
3. Admin approves installment #1
4. **Expected**: No commissions yet (not all paid)
5. User uploads proof for installment #2
6. Admin approves installment #2
7. **Expected**: No commissions yet (not all paid)
8. User uploads proof for installment #3
9. Admin approves installment #3
10. **Expected**: Commissions created for all upline agents

### Test Scenario 3: No Referring Agent

1. Create property interest without referring_agent_id
2. Complete all payments
3. **Expected**: No commissions created (no error thrown)

### Test Scenario 4: Duplicate Approval Check

1. Complete all payments (commissions created)
2. Admin rejects a payment (status back to pending)
3. Admin re-approves the payment
4. **Expected**: No duplicate commissions created

## Database Queries for Verification

### Check Commissions Created

```sql
select
  c.*,
  p.full_name as agent_name,
  pi.id as property_interest_id
from commissions c
join profiles p on p.id = c.agent_id
join property_interests pi on pi.id = c.property_interest_id
where c.property_interest_id = '<property-interest-id>'
order by c.level;
```

### Check Property Interest Status

```sql
select
  pi.id,
  pi.status,
  pi.completed_at,
  count(ip.id) as total_payments,
  count(case when ip.status = 'paid' then 1 end) as paid_payments
from property_interests pi
left join installment_payments ip on ip.property_interest_id = pi.id
where pi.id = '<property-interest-id>'
group by pi.id, pi.status, pi.completed_at;
```

### View Upline Chain for Agent

```sql
with recursive upline_chain as (
  -- Start with the referring agent
  select
    agent_id,
    upline_id,
    1 as level
  from agent_hierarchy
  where agent_id = '<referring-agent-id>' and approved = true

  union all

  -- Recursively get upline agents
  select
    ah.agent_id,
    ah.upline_id,
    uc.level + 1
  from agent_hierarchy ah
  join upline_chain uc on ah.agent_id = uc.upline_id
  where ah.approved = true and uc.level < 5
)
select
  uc.level,
  uc.upline_id,
  p.full_name,
  p.email
from upline_chain uc
join profiles p on p.id = uc.upline_id
order by uc.level;
```

## Troubleshooting

### Issue: Commissions Not Created

**Check**:

1. Are all payments marked as `paid`?
2. Does the property interest have a `referring_agent_id`?
3. Is there an agent hierarchy chain for the referring agent?
4. Are there commission settings configured?
5. Check browser console for error logs

### Issue: Duplicate Commissions

**Check**:

1. Run query to find duplicates:

```sql
select property_interest_id, agent_id, count(*)
from commissions
where property_interest_id is not null
group by property_interest_id, agent_id
having count(*) > 1;
```

**Fix**: Delete duplicates manually and ensure migration script was applied

### Issue: Wrong Commission Amounts

**Check**:

1. Verify commission_settings percentages
2. Check if property price is correct
3. Verify calculation: `amount * (percentage / 100)`

## Future Enhancements

- [ ] Add notification system when commissions are disbursed
- [ ] Email agents when they earn commissions
- [ ] Add commission disbursement log/audit trail
- [ ] Dashboard widget showing pending commission amounts
- [ ] Batch processing for multiple property completions
- [ ] Commission preview before final approval
- [ ] Support for custom commission structures per property

## Related Files

- `components/payment-approval-list.tsx` - Main implementation
- `components/approvals-list.tsx` - Original commission logic reference
- `scripts/022_add_property_interest_to_commissions.sql` - Database migration
- `app/dashboard/admin/property-interests/[id]/page.tsx` - Admin detail page

## Notes

- Commission calculation uses property price, not sum of installment payments
- Commissions are created when property interest status becomes `completed`
- The system is designed to be safe and idempotent
- All commission operations are logged to console for debugging
