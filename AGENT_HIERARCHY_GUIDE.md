# Agent Hierarchy System - Complete Guide

## Overview

The agent hierarchy system is the backbone of the MLM (Multi-Level Marketing) structure in this dashboard. It tracks upline/downline relationships between agents and determines commission distribution across multiple levels.

## How and When Agent Hierarchy is Created

### 🔥 Current System: **Automatic Creation When Property Purchase Completes**

The agent hierarchy is **automatically created** when all installment payments for a property interest are approved and the property purchase is completed.

#### Location: `components/payment-approval-list.tsx`

### The Property Interest Payment Flow

```
1. User expresses interest in property (with optional referring agent)
2. User makes installment payments
3. User uploads payment proofs
4. Admin approves each payment
5. When ALL payments are approved:
   ✓ Property interest status → "completed"
   ✓ Agent hierarchy relationship created (buyer → referring agent)
   ✓ Commission records created for upline chain
```

### Code Implementation

**File**: `components/payment-approval-list.tsx` (in `checkAndDisburseCommissions` function)

```typescript
// When all installment payments are approved:
if (interest.referring_agent_id && interest.referring_agent) {
  // Create agent hierarchy relationship (buyer becomes agent under referring agent)
  await createAgentHierarchy(interest.user_id, interest.referring_agent_id);

  // Then disburse commissions up the chain
  await calculateCommissions(
    interestId,
    interest.referring_agent.id,
    propertyPrice
  );
}
```

### Agent Hierarchy Creation Function

```typescript
const createAgentHierarchy = async (
  buyerId: string,
  referringAgentId: string
) => {
  // Check if hierarchy relationship already exists
  const { data: existingHierarchy } = await supabase
    .from("agent_hierarchy")
    .select("id")
    .eq("agent_id", buyerId)
    .eq("upline_id", referringAgentId)
    .single();

  if (existingHierarchy) {
    return; // Already exists, skip
  }

  // Create the hierarchy relationship
  await supabase.from("agent_hierarchy").insert([
    {
      agent_id: buyerId, // The buyer becomes an agent
      upline_id: referringAgentId, // Referring agent is their upline
      level: 1, // Direct relationship
      approved: true, // Auto-approved
      approved_at: new Date().toISOString(),
    },
  ]);
};
```

### What This Means

When a property purchase is completed:

- **Buyer** becomes an agent in the system
- **Referring Agent** becomes their upline (if one was specified)
- A **direct relationship** (Level 1) is established
- Relationship is **automatically approved**
- Commissions flow up the chain from this point forward

### Example Scenario

```
Timeline:
1. Mary expresses interest in Property X (John is the referring agent)
2. Mary makes 3 installment payments over time
3. Mary uploads payment proofs for each installment
4. Admin approves payment #1 → No hierarchy yet (not complete)
5. Admin approves payment #2 → No hierarchy yet (not complete)
6. Admin approves payment #3 → ALL COMPLETE!
   - Mary becomes an agent
   - John becomes Mary's upline (Level 1)
   - Commissions disbursed to John and his uplines

Now when Mary refers someone:
1. Bob expresses interest in Property Y (Mary is the referring agent)
2. Bob completes all payments
3. System creates:
   - Bob becomes an agent
   - Mary becomes Bob's upline (Level 1)
   - John is now Bob's Level 2 upline (through Mary)

Network Structure:
John (Original Agent)
  └── Mary (Level 1 downline of John)
       └── Bob (Level 1 downline of Mary, Level 2 of John)
```

### Old System (Legacy - No Longer Used)

⚠️ **The old payment submission flow is deprecated.**

Previously, hierarchy was created through `approvals-list.tsx` when an admin approved a "payment submission" (a different workflow where agents submitted payments on behalf of buyers).

**This workflow is no longer active** - the system now uses:

- Property Interests → Installment Payments → Payment Approval → Hierarchy Creation

## Database Schema

### Table: `agent_hierarchy`

```sql
create table public.agent_hierarchy (
  id uuid primary key,
  agent_id uuid references profiles(id),      -- The agent/downline
  upline_id uuid references profiles(id),     -- Their direct upline
  level integer default 1,                     -- Always 1 (direct relationship)
  approved boolean default false,              -- Always true in current system
  approved_by uuid references profiles(id),   -- Admin who approved
  approved_at timestamp,                       -- When approved
  created_at timestamp
);
```

### Key Fields Explained

| Field         | Purpose                                   | Current Usage                    |
| ------------- | ----------------------------------------- | -------------------------------- |
| `agent_id`    | The agent (downline) in this relationship | Set to buyer's profile ID        |
| `upline_id`   | Their direct upline                       | Set to submitter's profile ID    |
| `level`       | Relationship level                        | Always `1` (direct relationship) |
| `approved`    | Whether relationship is active            | Always `true` (auto-approved)    |
| `approved_at` | Approval timestamp                        | Set when payment approved        |

### Important Note About `level` Field

⚠️ **The `level` column is always `1`** - it represents a **direct** relationship, not the depth in the network.

The actual commission level (1-5) is calculated dynamically by:

1. Starting with an agent
2. Following `upline_id` references up the chain
3. Counting how many "hops" up you go

See: `getUplineChain()` function in `approvals-list.tsx` and `payment-approval-list.tsx`

## How Commission Levels Are Calculated

### Dynamic Chain Traversal

Both commission disbursement systems use the same logic:

```typescript
const getUplineChain = async (agentId: string) => {
  const uplineChain = [];
  let currentAgentId = agentId;

  // Traverse up the hierarchy (max 5 levels)
  for (let i = 0; i < 5; i++) {
    const { data: hierarchy } = await supabase
      .from("agent_hierarchy")
      .select("upline_id")
      .eq("agent_id", currentAgentId)
      .eq("approved", true)
      .limit(1);

    if (hierarchy && hierarchy[0]?.upline_id) {
      uplineChain.push({ id: hierarchy[0].upline_id });
      currentAgentId = hierarchy[0].upline_id; // Move up one level
    } else {
      break; // No more uplines
    }
  }

  return uplineChain;
};
```

### Visual Example

Database Records:

```
agent_hierarchy table:
┌─────────────┬─────────────┬───────┬──────────┐
│ agent_id    │ upline_id   │ level │ approved │
├─────────────┼─────────────┼───────┼──────────┤
│ Bob         │ Mary        │   1   │   true   │
│ Mary        │ John        │   1   │   true   │
│ John        │ Sarah       │   1   │   true   │
│ Sarah       │ Admin       │   1   │   true   │
└─────────────┴─────────────┴───────┴──────────┘
```

When Bob makes a sale:

```
getUplineChain("Bob") returns:
[
  { id: "Mary" },   // Level 1 - Direct upline
  { id: "John" },   // Level 2 - Mary's upline
  { id: "Sarah" },  // Level 3 - John's upline
  { id: "Admin" }   // Level 4 - Sarah's upline
]

Commission Distribution (if property = $100,000):
- Mary (Level 1):  5% = $5,000
- John (Level 2):  3% = $3,000
- Sarah (Level 3): 2% = $2,000
- Admin (Level 4): 1% = $1,000
```

## Where Agent Hierarchy is Used

### 1. Commission Calculation (Payment Approvals)

**File**: `components/approvals-list.tsx`

When payment submission is approved:

- Creates hierarchy relationship
- Calculates commissions for upline chain
- Distributes based on `commission_settings` table

### 2. Commission Calculation (Property Interest Payments)

**File**: `components/payment-approval-list.tsx`

When all installment payments are approved:

- Checks if all payments complete
- Gets referring agent's upline chain
- Disburses commissions up to 5 levels

### 3. Network Visualization

**File**: `app/dashboard/network/page.tsx`

Displays agent's network:

- Shows direct upline
- Shows direct downlines
- Network statistics (total downlines, earnings)

### 4. Agent Statistics

**File**: `app/dashboard/admin/agents/page.tsx`

Admin view of all agents:

- Count of downlines per agent
- Total commission earnings
- Network performance metrics

## Current Limitations & Gaps

### ❌ No Manual Creation Interface

Currently, there is **NO UI** for admins to manually create agent hierarchy relationships.

**Missing Features**:

- Add agent to network manually
- Assign upline to existing agent
- Move agents between uplines
- Bulk import hierarchy structure

### ❌ No Self-Registration with Referral

Agents cannot sign up with a referral code/link that automatically assigns them an upline.

**Missing Features**:

- Referral code system
- Registration page with referral parameter
- Automatic hierarchy creation on signup

### ❌ No Approval Workflow

Current system auto-approves all relationships. There's no pending state or admin review.

**Schema supports it** (`approved` and `approved_by` fields) but not implemented in UI.

## Querying Agent Hierarchy

### Get Direct Upline for an Agent

```sql
select
  ah.*,
  upline.full_name as upline_name,
  upline.email as upline_email
from agent_hierarchy ah
join profiles upline on upline.id = ah.upline_id
where ah.agent_id = '<agent-id>'
  and ah.approved = true;
```

### Get All Direct Downlines for an Agent

```sql
select
  ah.*,
  agent.full_name as agent_name,
  agent.email as agent_email
from agent_hierarchy ah
join profiles agent on agent.id = ah.agent_id
where ah.upline_id = '<upline-id>'
  and ah.approved = true;
```

### Get Complete Upline Chain (Recursive)

```sql
with recursive upline_chain as (
  -- Start with the agent
  select
    agent_id,
    upline_id,
    1 as depth
  from agent_hierarchy
  where agent_id = '<agent-id>' and approved = true

  union all

  -- Recursively get uplines
  select
    ah.agent_id,
    ah.upline_id,
    uc.depth + 1
  from agent_hierarchy ah
  join upline_chain uc on ah.agent_id = uc.upline_id
  where ah.approved = true and uc.depth < 5
)
select
  uc.depth as level,
  uc.upline_id,
  p.full_name,
  p.email
from upline_chain uc
join profiles p on p.id = uc.upline_id
order by uc.depth;
```

### Get Complete Downline Network (Recursive)

```sql
with recursive downline_tree as (
  -- Start with the agent
  select
    agent_id,
    upline_id,
    1 as depth
  from agent_hierarchy
  where upline_id = '<upline-id>' and approved = true

  union all

  -- Recursively get downlines
  select
    ah.agent_id,
    ah.upline_id,
    dt.depth + 1
  from agent_hierarchy ah
  join downline_tree dt on ah.upline_id = dt.agent_id
  where ah.approved = true and dt.depth < 10
)
select
  dt.depth as level,
  dt.agent_id,
  p.full_name,
  p.email,
  p.created_at
from downline_tree dt
join profiles p on p.id = dt.agent_id
order by dt.depth, p.created_at;
```

### Network Statistics for Agent

```sql
select
  upline.id as upline_id,
  upline.full_name as upline_name,
  upline.email as upline_email,
  count(distinct downlines.agent_id) as total_downlines,
  sum(c.amount) as total_commissions
from profiles upline
left join agent_hierarchy my_upline
  on my_upline.upline_id = upline.id
  and my_upline.agent_id = '<agent-id>'
left join agent_hierarchy downlines
  on downlines.upline_id = upline.id
  and downlines.approved = true
left join commissions c
  on c.agent_id = upline.id
where upline.id = '<agent-id>'
group by upline.id, upline.full_name, upline.email;
```

## How to Manually Create Hierarchy Relationships

If you need to manually create agent hierarchy relationships (e.g., during setup or migration):

### Via SQL (Supabase SQL Editor)

```sql
-- Insert a new hierarchy relationship
insert into agent_hierarchy (
  agent_id,
  upline_id,
  level,
  approved,
  approved_at
) values (
  '<agent-uuid>',        -- Agent's profile ID
  '<upline-uuid>',       -- Upline's profile ID
  1,                      -- Always 1 for direct relationship
  true,                   -- Approve immediately
  now()                   -- Current timestamp
);
```

### Via API (Supabase Client)

```typescript
const { data, error } = await supabase.from("agent_hierarchy").insert([
  {
    agent_id: agentId,
    upline_id: uplineId,
    level: 1,
    approved: true,
    approved_at: new Date().toISOString(),
  },
]);
```

### Validation Rules

Before creating a relationship, ensure:

1. Both `agent_id` and `upline_id` exist in `profiles` table
2. Agent doesn't already have an upline (one upline per agent)
3. Upline is not the agent themselves (no self-reference)
4. Would not create a circular reference

## Future Enhancements

### Recommended Features to Implement

1. **Manual Hierarchy Management UI**

   - Admin page to assign/reassign uplines
   - Search and select agent + upline
   - Validation to prevent circular references
   - Bulk import from CSV

2. **Referral System**

   - Generate unique referral codes per agent
   - Registration page with referral parameter
   - Automatic hierarchy creation on signup
   - Referral dashboard with link sharing

3. **Approval Workflow**

   - Pending hierarchy requests
   - Admin review and approve/reject
   - Email notifications for approvals
   - Audit log of changes

4. **Network Management**

   - Move agents between uplines
   - Archive/deactivate relationships
   - Network reorganization tools
   - Conflict resolution for duplicate relationships

5. **Enhanced Network View**

   - Full tree visualization (not just direct relationships)
   - Expand/collapse levels
   - Search within network
   - Export network structure

6. **Bulk Operations**
   - Import hierarchy from CSV
   - Bulk assign agents to uplines
   - Batch approval of pending relationships
   - Bulk commission adjustments

## Related Files

- `components/approvals-list.tsx` - Creates hierarchy on payment approval
- `components/payment-approval-list.tsx` - Uses hierarchy for commission disbursement
- `app/dashboard/network/page.tsx` - Displays agent's network
- `app/dashboard/admin/agents/page.tsx` - Agent statistics with hierarchy data
- `components/agent-management.tsx` - Agent list (no hierarchy management)
- `scripts/003_create_agent_hierarchy.sql` - Database schema

## Security & RLS Policies

### Row Level Security (RLS) Policies

```sql
-- Agents can view their own hierarchy
create policy "Agents can view their own hierarchy"
  on agent_hierarchy for select
  using (
    agent_id = auth.uid() or
    upline_id = auth.uid() or
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Only admins can create relationships
create policy "Only admins can manage hierarchy"
  on agent_hierarchy for insert
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Only admins can update relationships
create policy "Only admins can update hierarchy"
  on agent_hierarchy for update
  using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
```

### Permissions Summary

| Action                 | Agent | Admin |
| ---------------------- | ----- | ----- |
| View own upline        | ✅    | ✅    |
| View own downlines     | ✅    | ✅    |
| View other's hierarchy | ❌    | ✅    |
| Create hierarchy       | ❌    | ✅    |
| Update hierarchy       | ❌    | ✅    |
| Delete hierarchy       | ❌    | ✅    |

## Troubleshooting

### Issue: No Commissions Being Created

**Check**:

1. Is agent hierarchy relationship created?
   ```sql
   select * from agent_hierarchy where agent_id = '<agent-id>';
   ```
2. Is relationship approved?
   ```sql
   select * from agent_hierarchy where agent_id = '<agent-id>' and approved = true;
   ```
3. Are there commission settings?
   ```sql
   select * from commission_settings order by level;
   ```

### Issue: Agent Has No Upline

**Cause**: Agent was created outside the payment approval flow

**Solution**: Manually create hierarchy relationship (see "How to Manually Create" section above)

### Issue: Circular Reference Error

**Symptom**: Error when creating hierarchy relationship

**Fix**: Check the upline chain to ensure no loops

```sql
-- This should not return any rows
with recursive chain as (
  select agent_id, upline_id, 1 as depth
  from agent_hierarchy
  where agent_id = '<new-agent-id>'

  union all

  select ah.agent_id, ah.upline_id, c.depth + 1
  from agent_hierarchy ah
  join chain c on ah.agent_id = c.upline_id
  where c.depth < 20
)
select * from chain where upline_id = '<new-agent-id>';
```

### Issue: Duplicate Hierarchy Records

**Symptom**: Agent has multiple uplines

**Check**:

```sql
select agent_id, count(*) as upline_count
from agent_hierarchy
where approved = true
group by agent_id
having count(*) > 1;
```

**Fix**: Delete duplicates, keeping the oldest/correct one

```sql
-- Review duplicates first
select * from agent_hierarchy
where agent_id in (
  select agent_id from agent_hierarchy
  where approved = true
  group by agent_id
  having count(*) > 1
)
order by agent_id, created_at;

-- Delete incorrect ones
delete from agent_hierarchy
where id = '<incorrect-record-id>';
```

## Summary

**Current State**:

- ✅ Agent hierarchy is automatically created on payment approval
- ✅ System tracks direct upline/downline relationships
- ✅ Commission calculation traverses hierarchy dynamically
- ✅ Network visualization shows direct relationships
- ❌ No manual hierarchy management UI
- ❌ No referral system for new agent signup
- ❌ No approval workflow (auto-approved)

**Key Takeaway**: The agent hierarchy is tightly coupled to the payment submission approval workflow. Every approved payment creates a new agent and assigns them to the submitter's network.
