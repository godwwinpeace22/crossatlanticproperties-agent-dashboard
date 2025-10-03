# My Referrals Feature Implementation

## Overview

Agents can now view all property interests that used their referral code/ID in their dashboard. This feature provides visibility into their referral network and tracks the status of referred customers.

## Features Implemented

### 1. Dashboard Widget - `MyReferralsCard`

**Location**: `components/my-referrals-card.tsx`

**Features**:

- Summary statistics (Total Value, Completed, Pending)
- Recent 5 referrals with customer info, property details, and status
- Status badges with icons (Completed ✓, Pending ⏱, Rejected ✗)
- Empty state with referral ID display
- "View All" button to dedicated page

**Data Displayed**:

- Customer name and email
- Property name, price, and city
- Date of interest submission
- Current status (pending, approved, completed, rejected)
- Total value of all referred properties

### 2. Dedicated Referrals Page

**Location**: `app/dashboard/referrals/page.tsx`

**Features**:

- Complete statistics dashboard with 4 key metrics:
  - Total Referrals count
  - Total Property Value
  - Completed Sales count
  - Commissions Earned (from entire network)
- Referral Information Card with copyable Referral ID
- Full table view of all referrals with filtering/sorting
- Empty state with call-to-action

**Table Columns**:

- Customer (name + email)
- Property (name, city, category)
- Value (property price)
- Payment Plan
- Date (when interest was submitted)
- Status (with colored badges)

### 3. Navigation Integration

**Location**: `components/dashboard-nav.tsx`

**Changes**:

- Added "My Referrals" navigation item with UserPlus icon
- Positioned in MLM Features section (between Network and Commissions)
- Active state highlighting when on referrals page

### 4. Dashboard Integration

**Location**: `app/dashboard/page.tsx`

**Changes**:

- Added query to fetch referrals using `referring_agent_id`
- Integrated `MyReferralsCard` component in agent dashboard
- Shows referral summary alongside property investments

## Database Query

### Fetching Referrals

```typescript
const { data: myReferrals } = await supabase
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

**Key Points**:

- Filters by `referring_agent_id` (the agent's user ID)
- Joins with `profiles` to get customer information
- Joins with `properties` to get property details
- Ordered by most recent first

## How It Works

### Referral Flow

```
1. Agent shares their referral ID (user.id) with potential buyer
2. Buyer expresses interest in property
3. Buyer enters agent's referral ID in property interest form
4. System sets referring_agent_id = agent's ID
5. Property interest appears in agent's referrals list
6. Agent can track status from pending → approved → completed
7. When completed, commissions are disbursed to agent
```

### Referral ID System

- **Referral ID**: Agent's user ID (UUID)
- **Display Format**: First 8 characters (e.g., `a1b2c3d4`)
- **Full ID**: Available for copying in referrals page
- **Usage**: Buyers enter this ID when submitting property interest

## Visual Design

### Status Badges

```
✓ Completed (Green) - All payments made, commissions disbursed
✓ Approved (Blue) - Interest approved, payment schedule created
⏱ Pending (Yellow) - Awaiting admin approval
⏱ Payment Pending (Orange) - Awaiting application fee
✗ Rejected (Red) - Interest rejected by admin
○ Withdrawn (Gray) - Customer withdrew interest
```

### Empty States

1. **Dashboard Widget**: Shows referral ID with message to start sharing
2. **Referrals Page**: Shows large icon with CTA to browse properties

## Statistics Calculated

### Dashboard Widget Stats

- **Total Value**: Sum of all referred property prices
- **Completed**: Count of referrals with status = "completed"
- **Pending**: Count of referrals with status = "pending" or "approved"

### Referrals Page Stats

- **Total Referrals**: Total count of all referrals
- **Total Property Value**: Sum of all property prices
- **Completed Sales**: Count with status = "completed"
- **Commissions Earned**: Sum of all commissions earned by agent

## User Experience

### Agent Journey

1. **First Visit (No Referrals)**:

   - Dashboard shows empty state with referral ID
   - Encouragement to share referral code
   - Clear display of their unique ID

2. **With Referrals**:

   - Dashboard shows summary with key stats
   - Recent 5 referrals visible immediately
   - Click "View All" to see complete list

3. **Referrals Page**:
   - Comprehensive overview of all referral activity
   - Copyable referral ID for easy sharing
   - Full table with all details and status tracking

### Mobile Responsive

- Cards stack vertically on mobile
- Table scrolls horizontally if needed
- Touch-friendly buttons and badges

## Integration Points

### Existing Features

- ✅ **Property Interests**: Referrals sourced from property_interests table
- ✅ **Agent Hierarchy**: Referring agent becomes upline when purchase completes
- ✅ **Commissions**: Linked to commission disbursement system
- ✅ **Network**: Referrals eventually become downlines in network

### Related Tables

- `property_interests.referring_agent_id` → Agent who referred
- `property_interests.referral_code` → Code used (optional text field)
- `agent_hierarchy` → Created when referral completes purchase
- `commissions` → Earned when referral's payments complete

## Future Enhancements

### Potential Features to Add

1. **Referral Code Generator**

   - Generate memorable codes (e.g., "JOHN2024")
   - Map codes to agent IDs
   - Track which code was used

2. **Referral Links**

   - Generate unique URLs with embedded referral ID
   - Share via social media, email, WhatsApp
   - Track clicks and conversions

3. **Conversion Tracking**

   - Conversion rate (interests → completed)
   - Average property value per referral
   - Time to completion metrics

4. **Referral Rewards**

   - Bonus commissions for X referrals
   - Leaderboards for top referrers
   - Achievement badges

5. **Communication Tools**

   - Send messages to referred customers
   - Automated follow-up reminders
   - Status change notifications

6. **Export Functionality**

   - Export referrals to CSV/Excel
   - Generate referral reports
   - Share reports with management

7. **Filtering & Search**

   - Filter by status, date range, property
   - Search by customer name/email
   - Sort by various columns

8. **Analytics Dashboard**
   - Referral trends over time (charts)
   - Monthly/quarterly reports
   - Predictive commission estimates

## Testing Checklist

### Functionality Tests

- [ ] Dashboard widget displays correctly with referrals
- [ ] Dashboard widget shows empty state when no referrals
- [ ] "View All" button navigates to referrals page
- [ ] Referrals page shows all referrals
- [ ] Statistics are calculated correctly
- [ ] Status badges display with correct colors
- [ ] Referral ID is displayed correctly
- [ ] Navigation "My Referrals" link works
- [ ] Active state highlights on referrals page

### Data Tests

- [ ] Referrals filtered by correct agent ID
- [ ] Customer information displays correctly
- [ ] Property information displays correctly
- [ ] Dates format correctly
- [ ] Status changes reflect in real-time (after refresh)
- [ ] Empty state appears when agent has no referrals

### Edge Cases

- [ ] Agent with 0 referrals
- [ ] Agent with 1 referral
- [ ] Agent with 100+ referrals
- [ ] Referral with no customer name (shows email)
- [ ] Referral with missing property data
- [ ] Very long property names (truncation)
- [ ] Very old referrals (date display)

### Permissions

- [ ] Only logged-in users can access
- [ ] Agent can only see their own referrals
- [ ] Admin cannot access agent referrals page (or sees different view)
- [ ] Redirects to login if not authenticated

## Database Schema

### Relevant Fields in `property_interests`

```sql
CREATE TABLE property_interests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),           -- Customer who expressed interest
  property_id UUID REFERENCES properties(id),      -- Property they're interested in
  referring_agent_id UUID REFERENCES profiles(id), -- Agent who referred them
  referral_code TEXT,                              -- Optional text code used
  status TEXT,                                     -- pending, approved, completed, etc.
  selected_payment_plan TEXT,                      -- Payment plan chosen
  created_at TIMESTAMP,
  ...
);

-- Index for fast querying
CREATE INDEX idx_property_interests_referring_agent
  ON property_interests(referring_agent_id);
```

## API Routes (None Required)

This feature uses Server Components and direct Supabase queries:

- No API routes needed
- All data fetched server-side
- Client components only for UI interactivity

## Security Considerations

### RLS Policies

Ensure existing RLS policies allow agents to view referrals:

```sql
-- Agents can view property interests where they are the referring agent
CREATE POLICY "Agents can view their referrals"
  ON property_interests FOR SELECT
  USING (
    referring_agent_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### Data Privacy

- ✅ Agents only see referrals linked to their ID
- ✅ Customer data limited to name, email (no sensitive info)
- ✅ Payment details not exposed in referrals view
- ✅ Admin can override for management purposes

## Performance Considerations

### Optimizations

- **Database Indexes**: Already created on `referring_agent_id`
- **Query Limits**: Dashboard widget limits to 5 recent
- **Server-Side Rendering**: Data fetched server-side, no client waterfalls
- **Pagination**: Consider adding for agents with 50+ referrals

### Caching

- Server Components cache by default in Next.js
- Use `revalidatePath` for real-time updates if needed
- Consider adding SWR/React Query for client-side caching

## Comparison with Network Feature

| Feature         | My Referrals            | My Network               |
| --------------- | ----------------------- | ------------------------ |
| **Data Source** | `property_interests`    | `agent_hierarchy`        |
| **Shows**       | Property interests      | Agent downlines          |
| **Timing**      | When interest submitted | When purchase completed  |
| **Purpose**     | Track referral pipeline | View established network |
| **Status**      | Pending → Completed     | Always approved          |
| **Value**       | Property prices         | Commission structure     |

**Relationship**: Referrals become Network members when they complete their purchase.

## Related Files

- `components/my-referrals-card.tsx` - Dashboard widget component
- `app/dashboard/referrals/page.tsx` - Full referrals page
- `app/dashboard/page.tsx` - Dashboard integration
- `components/dashboard-nav.tsx` - Navigation integration
- `scripts/017_create_property_interests.sql` - Database schema

## Documentation Updates

This feature integrates with:

- Agent hierarchy creation (when referrals complete)
- Commission disbursement (from completed referrals)
- Network visualization (referrals → downlines)

## Summary

✅ **Agents can now view all property interests that used their referral**

The system provides:

1. Dashboard widget showing recent referrals with stats
2. Dedicated page with full referral list and analytics
3. Clear referral ID for sharing with potential buyers
4. Real-time status tracking from interest → completion
5. Connection to commission earnings

This creates transparency and motivates agents to actively refer new customers to properties.
