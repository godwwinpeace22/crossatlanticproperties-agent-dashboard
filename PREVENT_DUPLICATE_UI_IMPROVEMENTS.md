# UI Improvements: Show Interest Status Before Button Click

## Overview

Enhanced the property detail page to show users whether they've already expressed interest **before** they click the button, providing better UX and preventing confusion.

## Changes Made

### 1. Created New Hook: `usePropertyInterest`

**File:** `/hooks/use-property-interest.ts`

**Purpose:** Check if authenticated user has already expressed interest in a property

**Returns:**

```typescript
{
  hasInterest: boolean; // Has the user expressed interest?
  interestId: string | null; // ID of the interest record
  status: string | null; // Current status of the interest
  isLoading: boolean; // Loading state
}
```

**Features:**

- Automatically checks on mount when user is authenticated
- Returns loading state for smooth UI
- Handles errors gracefully
- Uses `maybeSingle()` to avoid errors when no record exists

### 2. Updated Property Detail Page

**File:** `/app/(main)/properties/[id]/page.tsx`

#### Added Status Display Helper

```typescript
const getInterestStatusDisplay = (status: string) => {
  const statusMap: Record<string, { label: string; color: string }> = {
    payment_pending: { label: "Payment Pending", color: "text-orange-600" },
    payment_failed: { label: "Payment Failed", color: "text-red-600" },
    pending: { label: "Under Review", color: "text-blue-600" },
    approved: { label: "Approved", color: "text-green-600" },
    rejected: { label: "Rejected", color: "text-red-600" },
    withdrawn: { label: "Withdrawn", color: "text-gray-600" },
    completed: { label: "Completed", color: "text-green-600" },
  };

  return statusMap[status] || { label: status, color: "text-gray-600" };
};
```

#### Updated Button Logic

**Before:**

```tsx
<Button onClick={() => setIsInterestWorkflowOpen(true)}>I'm Interested</Button>
```

**After:**

```tsx
{
  hasInterest ? (
    <div className="space-y-2">
      <Button disabled variant="secondary">
        ✓ Interest Already Submitted
      </Button>
      <p className="text-xs text-center">
        Status: <span className="font-semibold">Under Review</span>
      </p>
    </div>
  ) : (
    <Button onClick={() => setIsInterestWorkflowOpen(true)}>
      I'm Interested
    </Button>
  );
}
```

## User Experience

### Before Implementation

1. User clicks "I'm Interested"
2. Dialog opens and checks for existing interest
3. Toast shows "Interest Already Submitted"
4. Dialog closes
   ❌ User confused - why did the button work if they already submitted?

### After Implementation

1. Button shows "✓ Interest Already Submitted" (disabled)
2. Status displays below: "Status: Under Review"
3. User immediately understands they've already expressed interest
   ✅ Clear, immediate feedback

## Visual States

### State 1: Loading

```
[Checking...]  (disabled button)
```

### State 2: No Interest Yet

```
[I'm Interested]  (green button, clickable)
```

### State 3: Interest Exists

```
[✓ Interest Already Submitted]  (gray button, disabled)
Status: Under Review             (colored status text)
```

## Status Colors

| Status            | Label           | Color  |
| ----------------- | --------------- | ------ |
| `payment_pending` | Payment Pending | Orange |
| `payment_failed`  | Payment Failed  | Red    |
| `pending`         | Under Review    | Blue   |
| `approved`        | Approved        | Green  |
| `rejected`        | Rejected        | Red    |
| `withdrawn`       | Withdrawn       | Gray   |
| `completed`       | Completed       | Green  |

## Benefits

### 1. Better User Experience

- Users know status before clicking
- No surprise error messages
- Clear visual feedback

### 2. Reduced API Calls

- Hook checks once on page load
- No need to open dialog to check
- Prevents unnecessary workflow initialization

### 3. Clear Communication

- Status is always visible
- Color-coded for quick understanding
- Consistent with backend statuses

### 4. Prevents Confusion

- No "why can't I submit?" questions
- Users understand where they are in the process
- Reduces support requests

## Complete Protection Flow

Now with 4 layers:

```
1. UI Hook Check (usePropertyInterest)
   ↓ Disabled button shown

2. UI Dialog Check (checkAuthAndKYCStatus)
   ↓ Toast + close dialog

3. API Check (payments/initialize)
   ↓ 409 error returned

4. Database Constraint
   ↓ Unique violation error
```

## Testing Scenarios

### Test 1: First Time User

1. Open property page
2. See "I'm Interested" button (green)
3. Click and complete flow
   ✅ Expected: Success

### Test 2: Returning User

1. Open property page
2. See "✓ Interest Already Submitted" (gray, disabled)
3. See status below button
   ✅ Expected: Can't click button, sees status

### Test 3: Status Changes

1. Admin changes status to "approved"
2. User refreshes page
3. Button still shows "Interest Already Submitted"
4. Status updates to "Approved" (green)
   ✅ Expected: Status reflects change

### Test 4: Not Authenticated

1. User not logged in
2. Button shows "I'm Interested"
3. Click opens auth flow
   ✅ Expected: Standard flow for unauthenticated users

## Future Enhancements

### 1. Real-time Updates

Add websocket/subscription to update status live:

```typescript
useEffect(() => {
  const subscription = supabase
    .channel("property_interests")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "property_interests",
        filter: `property_id=eq.${propertyId}`,
      },
      (payload) => {
        // Update status in real-time
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, [propertyId]);
```

### 2. Action Buttons for Different Statuses

```tsx
{
  status === "payment_failed" && (
    <Button onClick={retryPayment}>Retry Payment</Button>
  );
}

{
  status === "rejected" && <Button onClick={reapply}>Reapply</Button>;
}
```

### 3. Progress Indicator

```tsx
<div className="mt-2">
  <div className="flex items-center space-x-2">
    <div className="flex-1 h-2 bg-gray-200 rounded">
      <div className="h-2 bg-green-500 rounded" style={{ width: "66%" }} />
    </div>
    <span className="text-xs">2/3 Complete</span>
  </div>
</div>
```

### 4. Tooltip with More Info

```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button disabled>✓ Interest Already Submitted</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Submitted on: {formatDate(createdAt)}</p>
      <p>Current status: {status}</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Accessibility

- ✅ Button properly disabled when interest exists
- ✅ Status text readable with proper color contrast
- ✅ Loading state communicated clearly
- ✅ Screen readers will announce "button, disabled"

## Performance

- Hook uses SWR-like pattern (can add SWR for caching)
- Single query on mount
- No polling or excessive re-fetching
- Minimal impact on page load
