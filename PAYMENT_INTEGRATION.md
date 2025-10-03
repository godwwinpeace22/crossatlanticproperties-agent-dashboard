# Interest Application Fee Payment Integration

This document explains how the interest application fee payment system works.

## Overview

Users must pay a **₦10,000 application fee** before submitting their property interest. This fee is processed via Paystack and tracked in the database.

## Workflow

1. **User selects payment plan** → Goes to application fee payment step
2. **User clicks "Pay ₦10,000"** → Redirected to Paystack checkout
3. **User completes payment** → Redirected back to verification page
4. **Payment verified** → Interest submission unlocked
5. **Admin can view** all payments in admin dashboard

## Database Schema

### `interest_payments` Table

- Tracks all application fee payments
- Links to user, property, and property_interest
- Stores Paystack transaction details

```sql
CREATE TABLE interest_payments (
  id UUID PRIMARY KEY,
  property_interest_id UUID REFERENCES property_interests(id),
  user_id UUID REFERENCES profiles(id),
  property_id UUID REFERENCES properties(id),
  amount DECIMAL(15, 2) DEFAULT 10000.00,
  currency VARCHAR(3) DEFAULT 'NGN',
  payment_reference VARCHAR(255) UNIQUE,
  payment_status VARCHAR(50) DEFAULT 'pending',
  paystack_response JSONB,
  paid_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### `property_interests` Table Update

- Added `interest_payment_id` column
- Links interest submission to payment record

## API Endpoints

### POST `/api/payments/initialize`

Initializes a Paystack payment transaction.

**Request:**

```json
{
  "property_id": "uuid",
  "property_name": "Property Name",
  "callback_url": "https://yourapp.com/payment/verify"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "...",
    "reference": "INT-1234567890-123456",
    "payment_id": "uuid"
  }
}
```

### GET `/api/payments/verify?reference=INT-xxx`

Verifies a Paystack payment and updates the database.

**Response:**

```json
{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "status": "success",
    "amount": 10000,
    "reference": "INT-1234567890-123456",
    "paid_at": "2025-10-01T12:00:00Z",
    "verification": { ...paystack_data }
  }
}
```

## Environment Variables

Add these to your `.env.local`:

```bash
# Paystack Keys (from https://dashboard.paystack.com/#/settings/developer)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx

# App URL for callbacks
NEXT_PUBLIC_APP_URL=https://yourapp.com
```

## Admin Dashboard

Admins can view all interest payments at:
**`/dashboard/admin/interest-payments`**

Features:

- View all payments (successful, pending, failed)
- See payment statistics and total revenue
- Track which payments are linked to interest submissions
- View user and property details for each payment

## Payment Flow in UI

### Property Interest Workflow Component

The `PropertyInterestWorkflow` component handles the entire flow:

1. **Authentication Check** → Ensure user is signed in
2. **KYC Check** → Verify KYC is approved
3. **Payment Plan Selection** → Choose payment plan
4. **Application Fee Payment** → Pay ₦10,000 via Paystack
5. **Payment Verification** → Confirm payment success
6. **Final Submission** → Create property interest record

### Key Functions

- `handleInitializePayment()` - Starts Paystack payment
- `handleFinalSubmission()` - Creates interest after payment
- Workflow only proceeds after successful payment

## Testing

### Test Cards (Paystack Test Mode)

```
Success: 4084 0840 8408 4081
Success with PIN: 5060 6666 6666 6666 6666 (PIN: 1234)
Insufficient Funds: 5060 6666 6666 6666 6665
```

### Test Flow

1. Use test keys from Paystack dashboard
2. Go through property interest workflow
3. Use test card on Paystack checkout
4. Verify payment is recorded in database
5. Check admin dashboard shows payment

## Security

- Secret key stored server-side only
- Public key used client-side for initialization
- Payment verification done server-side
- RLS policies protect payment data
- Only users can see their own payments
- Admins can see all payments

## Monitoring

Track these metrics:

- Payment success rate
- Failed payment reasons
- Average time to payment
- Revenue from application fees
- Conversion from payment to interest submission

## Webhooks (Optional Enhancement)

For production, set up Paystack webhooks to handle:

- Payment success notifications
- Payment failures
- Disputed charges

Webhook URL: `/api/webhooks/paystack`

## Support

For payment issues:

1. Check Paystack dashboard for transaction details
2. Verify payment reference in database
3. Check user's payment status in admin dashboard
4. Contact Paystack support if needed
