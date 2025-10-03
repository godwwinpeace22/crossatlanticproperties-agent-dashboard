# Updated Agent Hierarchy Creation Flow

## Summary of Changes

The agent hierarchy creation has been moved from the **old payment submission flow** to the **new property interest installment payment flow**.

## Previous System (Deprecated)

❌ **Old Flow** (`components/approvals-list.tsx`):

- Agent submits payment on behalf of buyer
- Admin approves payment submission
- System creates hierarchy immediately

**Problem**: This workflow is no longer being used. The system now uses property interests with installment payments.

## New System (Current)

✅ **New Flow** (`components/payment-approval-list.tsx`):

1. User expresses interest in property (optionally with referring agent ID)
2. User makes installment payments over time
3. User uploads payment proofs
4. Admin approves each payment
5. **When ALL payments are approved**:
   - Property interest status → `completed`
   - **Agent hierarchy created** (buyer → referring agent)
   - Commissions disbursed up the chain

## Implementation Details

### File: `components/payment-approval-list.tsx`

### New Function: `createAgentHierarchy()`

```typescript
const createAgentHierarchy = async (
  buyerId: string,
  referringAgentId: string
) => {
  try {
    // Check if hierarchy relationship already exists
    const { data: existingHierarchy } = await supabase
      .from("agent_hierarchy")
      .select("id")
      .eq("agent_id", buyerId)
      .eq("upline_id", referringAgentId)
      .single();

    if (existingHierarchy) {
      console.log("Agent hierarchy already exists for this relationship");
      return;
    }

    // Create the hierarchy relationship
    const { error: hierarchyError } = await supabase
      .from("agent_hierarchy")
      .insert([
        {
          agent_id: buyerId,
          upline_id: referringAgentId,
          level: 1,
          approved: true,
          approved_at: new Date().toISOString(),
        },
      ]);

    if (hierarchyError) {
      console.error("Error creating agent hierarchy:", hierarchyError);
      return;
    }

    console.log("Agent hierarchy created successfully:", {
      buyer: buyerId,
      upline: referringAgentId,
    });
  } catch (error) {
    console.error("Error in createAgentHierarchy:", error);
  }
};
```

### Integration in `checkAndDisburseCommissions()`

```typescript
// Calculate and create commissions if there's a referring agent
if (interest.referring_agent_id && interest.referring_agent) {
  // Create agent hierarchy relationship (buyer becomes agent under referring agent)
  await createAgentHierarchy(interest.user_id, interest.referring_agent_id);

  const propertyPrice = Number(interest.property?.price || 0);
  await calculateCommissions(
    interestId,
    interest.referring_agent.id,
    propertyPrice
  );
  console.log("Commissions disbursed successfully");
}
```

## How It Works

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Expresses Interest in Property                     │
│    - Fills out property interest form                      │
│    - Optional: Enters referral code → links to referring   │
│      agent (sets referring_agent_id)                       │
│    - Pays application fee                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Property Interest Created                               │
│    - Status: "pending"                                     │
│    - property_interests.referring_agent_id = <agent_id>    │
│    - No hierarchy created yet                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Admin Approves Property Interest                        │
│    - Status: "pending" → "approved"                        │
│    - Installment payment schedule created                  │
│    - Still no hierarchy created yet                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User Makes Installment Payments                         │
│    - Uploads payment proof for each installment           │
│    - Status: "pending" → "pending_verification"           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Admin Approves Each Payment                             │
│    - Payment #1: Status → "paid" (hierarchy not created)  │
│    - Payment #2: Status → "paid" (hierarchy not created)  │
│    - Payment #3: Status → "paid" (ALL COMPLETE!)          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. ALL PAYMENTS APPROVED TRIGGER                           │
│    ✓ Property interest status → "completed"               │
│    ✓ Check if referring_agent_id exists                   │
│    ✓ Create agent_hierarchy record                        │
│       - agent_id = buyer's user_id                         │
│       - upline_id = referring_agent_id                     │
│       - level = 1                                          │
│       - approved = true                                    │
│    ✓ Calculate commissions for upline chain (up to 5)     │
│    ✓ Create commission records                            │
└─────────────────────────────────────────────────────────────┘
```

## Database Changes

### Property Interests Table

Already has the necessary field:

```sql
CREATE TABLE property_interests (
  ...
  referring_agent_id UUID REFERENCES profiles(id),
  ...
);
```

### Agent Hierarchy Table

No changes needed - already supports this flow:

```sql
CREATE TABLE agent_hierarchy (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES profiles(id),      -- Buyer's ID
  upline_id UUID REFERENCES profiles(id),     -- Referring agent's ID
  level INTEGER DEFAULT 1,
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMP,
  created_at TIMESTAMP
);
```

## Key Features

### ✅ Automatic Hierarchy Creation

- No manual intervention needed
- Created only when property purchase is fully complete
- Ensures buyer has paid for property before becoming an agent

### ✅ Idempotent

- Checks if hierarchy already exists before creating
- Safe to run multiple times (won't create duplicates)

### ✅ Optional Referring Agent

- Works even if no referring agent specified
- Only creates hierarchy if `referring_agent_id` is set
- Gracefully handles cases without referrals

### ✅ Integrated with Commission Disbursement

- Hierarchy creation happens before commission calculation
- Ensures buyer is in network before commissions flow
- All in one transaction-like flow

## Testing Scenarios

### Scenario 1: Property Interest WITH Referring Agent

**Setup**:

- User: Mary (ID: user-123)
- Referring Agent: John (ID: agent-456)
- Property: Luxury Villa ($100,000)
- Payment Plan: 30-30-40 (3 installments)

**Steps**:

1. Mary expresses interest with John's referral code
   - `referring_agent_id` = agent-456
2. Admin approves interest → Installments created
3. Mary uploads proof for payment #1 ($30,000)
4. Admin approves payment #1 → Status: `paid` (no hierarchy yet)
5. Mary uploads proof for payment #2 ($30,000)
6. Admin approves payment #2 → Status: `paid` (no hierarchy yet)
7. Mary uploads proof for payment #3 ($40,000)
8. Admin approves payment #3 → Status: `paid` (**ALL COMPLETE**)

**Expected Results**:

```sql
-- Property interest updated
UPDATE property_interests SET
  status = 'completed',
  completed_at = NOW()
WHERE id = '<interest-id>';

-- Agent hierarchy created
INSERT INTO agent_hierarchy (
  agent_id,      -- user-123 (Mary)
  upline_id,     -- agent-456 (John)
  level,         -- 1
  approved,      -- true
  approved_at    -- NOW()
);

-- Commissions created for John and his uplines
INSERT INTO commissions (
  agent_id,               -- John's uplines
  property_interest_id,   -- <interest-id>
  amount,                 -- Percentage of $100,000
  percentage,             -- From commission_settings
  level                   -- 1, 2, 3, 4, 5
);
```

### Scenario 2: Property Interest WITHOUT Referring Agent

**Setup**:

- User: Bob (ID: user-789)
- Referring Agent: None
- Property: Condo ($50,000)
- Payment Plan: Full (1 payment)

**Steps**:

1. Bob expresses interest with no referral code
   - `referring_agent_id` = NULL
2. Admin approves interest → 1 installment created
3. Bob uploads proof for full payment ($50,000)
4. Admin approves payment → Status: `paid` (**ALL COMPLETE**)

**Expected Results**:

```sql
-- Property interest updated
UPDATE property_interests SET
  status = 'completed',
  completed_at = NOW()
WHERE id = '<interest-id>';

-- NO agent hierarchy created (no referring agent)
-- NO commissions created (no upline)
```

### Scenario 3: Re-approval (Edge Case)

**Setup**:

- All payments already approved once
- Commissions already disbursed
- Admin rejects a payment and re-approves

**Steps**:

1. All 3 payments approved (hierarchy + commissions created)
2. Admin rejects payment #3 → Status: `pending`
3. User re-uploads proof
4. Admin re-approves payment #3 → Status: `paid` (ALL COMPLETE again)

**Expected Results**:

- System checks for existing hierarchy → Found
- System skips hierarchy creation
- System checks for existing commissions → Found
- System skips commission creation
- No duplicates created ✅

## Console Logging

The system logs key events for debugging:

```typescript
// Success logs
✓ "Not all payments completed yet" - Not ready for disbursement
✓ "Commissions already disbursed for this property interest" - Skip duplicates
✓ "Agent hierarchy already exists for this relationship" - Skip duplicate hierarchy
✓ "Agent hierarchy created successfully: { buyer, upline }" - Hierarchy created
✓ "Commissions disbursed successfully" - All commissions created

// Error logs
✗ "Error fetching property interest:" - Database query failed
✗ "Error checking existing commissions:" - Commission check failed
✗ "Error creating agent hierarchy:" - Hierarchy creation failed
✗ "Error in checkAndDisburseCommissions:" - Overall process error
```

## Migration Notes

### For Existing Systems

If you have existing property interests that were completed before this update:

**Option 1: Retroactive Creation (Recommended)**

Create a migration script to establish missing hierarchies:

```sql
-- Find completed property interests with referring agents but no hierarchy
WITH missing_hierarchies AS (
  SELECT
    pi.id as property_interest_id,
    pi.user_id as buyer_id,
    pi.referring_agent_id as upline_id,
    pi.completed_at
  FROM property_interests pi
  WHERE pi.status = 'completed'
    AND pi.referring_agent_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM agent_hierarchy ah
      WHERE ah.agent_id = pi.user_id
        AND ah.upline_id = pi.referring_agent_id
    )
)
INSERT INTO agent_hierarchy (
  agent_id,
  upline_id,
  level,
  approved,
  approved_at,
  created_at
)
SELECT
  buyer_id,
  upline_id,
  1,
  true,
  completed_at,
  completed_at
FROM missing_hierarchies;
```

**Option 2: Manual Review**

Review each completed interest and decide case-by-case whether to create hierarchy.

## Related Files

- `components/payment-approval-list.tsx` - Main implementation
- `app/dashboard/admin/property-interests/[id]/page.tsx` - Admin detail page
- `scripts/017_create_property_interests.sql` - Property interests schema
- `scripts/003_create_agent_hierarchy.sql` - Agent hierarchy schema
- `COMMISSION_DISBURSEMENT.md` - Commission disbursement guide
- `AGENT_HIERARCHY_GUIDE.md` - Complete hierarchy guide

## Future Enhancements

### Potential Improvements

1. **Early Hierarchy Creation**

   - Create hierarchy when interest is approved (not when completed)
   - Prevents delay in network visibility
   - Commissions still wait for completion

2. **Referral Code System**

   - Auto-populate referring_agent_id from referral code
   - Track referral sources and conversions
   - Referral code validation

3. **Network Preview**

   - Show buyer their potential upline before completion
   - Display what network they'll join
   - Preview commission structure

4. **Hierarchy Notifications**

   - Notify referring agent when downline is added
   - Email when hierarchy is established
   - Dashboard notification for new downlines

5. **Partial Payment Networks**
   - Allow hierarchy creation after X% paid
   - Early network engagement
   - Incentivize early adopters

## Comparison: Old vs New System

| Aspect        | Old System (approvals-list) | New System (payment-approval-list) |
| ------------- | --------------------------- | ---------------------------------- |
| **Trigger**   | Payment submission approval | All installments paid              |
| **Workflow**  | Agent submits for buyer     | Buyer pays installments            |
| **Timing**    | Immediate on approval       | When property fully paid           |
| **Advantage** | Quick network building      | Ensures buyer commitment           |
| **Active?**   | ❌ Deprecated               | ✅ Current system                  |

## Summary

✅ **Agent hierarchy is now created when a buyer completes all installment payments for a property interest.**

The system:

1. Waits for all payments to be approved
2. Checks for a referring agent ID
3. Creates the hierarchy relationship
4. Disburses commissions up the chain

This ensures that only buyers who have fully committed to a property purchase become part of the agent network.
