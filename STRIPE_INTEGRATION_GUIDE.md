# Stripe Integration Implementation Guide

## Overview

This document provides step-by-step instructions for implementing and testing the production-ready Stripe subscription system for the English Dari Learning Platform.

---

## Part 1: Prerequisites & Setup

### 1.1 Stripe Account Setup

1. **Create Stripe Account**: Visit https://stripe.com and sign up for a business account
2. **Get API Keys**:
   - Navigate to Dashboard > Developers > API Keys
   - Copy your **Secret Key** (starts with `sk_test_` for testing)
   - Copy your **Publishable Key** (starts with `pk_test_`)

### 1.2 Environment Configuration

**Backend (.env)**
```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_WEBHOOK_SECRET_HERE
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE
```

### 1.3 Database Migration

Run Prisma migration to add Stripe fields to Subscription and Payment models:

```bash
cd backend
npx prisma db push
```

This creates the following new columns:
- `Subscription`: `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`, `stripeProductId`, `currentPeriodStart`, `currentPeriodEnd`, `cancelAtPeriodEnd`
- `Payment`: `stripePaymentIntentId`, `stripeCheckoutSessionId`, `stripeInvoiceId`
- `Plan`: `stripeProductId`, `stripePriceId`

---

## Part 2: Create Stripe Products

### 2.1 Create Products and Prices in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Create three products:

**Product 1: Seed Plan**
- Name: Seed Plan - SEED
- Price: Free (no price needed)
- Billing: Monthly recurring

**Product 2: Growth Plan**
- Name: Growth Plan - GROWTH
- Price: $9.99/month
- Billing: Monthly recurring

**Product 3: Success Plan**
- Name: Success Plan - SUCCESS
- Price: $19.99/month
- Billing: Monthly recurring

3. Copy the **Price IDs** (starts with `price_`) for each plan

### 2.2 Update Plans in Database

Insert the Stripe Price IDs into your local database:

```sql
UPDATE plans SET stripePriceId = 'price_xxx_seed' WHERE type = 'SEED';
UPDATE plans SET stripePriceId = 'price_xxx_growth' WHERE type = 'GROWTH';
UPDATE plans SET stripePriceId = 'price_xxx_success' WHERE type = 'SUCCESS';
```

---

## Part 3: Configure Webhooks

### 3.1 Create Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `http://localhost:4000/api/payments/stripe/webhook` (for development)
4. **Events to send**: Select the following:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

5. Copy the **Webhook Signing Secret** and add to `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_SECRET
```

### 3.2 Test Webhook (Local Development)

Use Stripe CLI to forward webhooks to your local server:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:4000/api/payments/stripe/webhook

# Copy the webhook signing secret from the CLI output and add to .env
```

---

## Part 4: Start Services

### 4.1 Start Backend

```bash
cd backend
npm run start:dev
```

### 4.2 Start Frontend

```bash
cd frontend
npm run dev
```

Access the application at http://localhost:3000

---

## Part 5: Test the Complete Flow

### Test 1: Free Plan Activation

1. Go to http://localhost:3000/pricing
2. Click "Get Started Free" on the Seed plan
3. **Expected Result**:
   - Subscription created in database with status `ACTIVE`
   - User redirected to dashboard
   - Database table: `subscriptions`

### Test 2: Paid Subscription (Stripe Test Card)

1. Go to http://localhost:3000/pricing
2. Click "Subscribe Now" on Growth or Success plan
3. Click "Pay with Card (Stripe)"
4. **Stripe Checkout Page**:
   - Email: `test@example.com`
   - Card Number: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - Name: Any name

5. **Expected Results**:
   - Checkout session created: `Payment.stripeCheckoutSessionId` = `cs_test_xxx`
   - User redirected to success page
   - **Webhook events fired**:
     - `checkout.session.completed`
     - `customer.subscription.created` (or `customer.subscription.updated`)
   - **Database updates**:
     - `Payment.status` = `COMPLETED`
     - `Subscription.status` = `ACTIVE`
     - `Subscription.stripeSubscriptionId` = `sub_xxx`
     - `Subscription.stripeCustomerId` = `cus_xxx`
     - `Subscription.currentPeriodStart` and `currentPeriodEnd` updated

### Test 3: Payment Failure

1. Use Stripe test card: `4000 0000 0000 0002` (decline)
2. **Expected Result**:
   - Payment redirected to cancel page
   - No subscription created
   - `Payment.status` remains `PENDING` or `FAILED`

### Test 4: Subscription Renewal

1. After successful subscription, invoice.paid webhook triggers renewal
2. **Expected Result**:
   - `Subscription.currentPeriodEnd` updated to next month

### Test 5: Subscription Cancellation

1. In user profile (once created), click "Cancel Subscription"
2. **Expected Result**:
   - API call to `POST /subscriptions/:id/cancel-at-stripe`
   - Subscription cancellation processed in Stripe
   - `Subscription.cancelAtPeriodEnd` = `true`
   - `Subscription.status` remains `ACTIVE` until period ends

### Test 6: Failed Invoice Payment

1. Manually trigger failed payment in Stripe (or use automation rules)
2. **Expected Result**:
   - `invoice.payment_failed` webhook fires
   - `Subscription.status` = `EXPIRED`
   - Premium content access revoked

---

## Part 6: Verification Checklist

### Database Verification

```sql
-- Check subscriptions with Stripe fields
SELECT id, userId, stripeCustomerId, stripeSubscriptionId, status FROM subscriptions;

-- Check payments with Stripe fields
SELECT id, userId, stripeCheckoutSessionId, stripePaymentIntentId, status FROM payments;

-- Check plans with Stripe fields
SELECT id, name, stripePriceId, stripeProductId FROM plans;
```

### API Endpoint Testing

**Create Checkout Session**
```bash
curl -X POST http://localhost:4000/api/payments/stripe/checkout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId":"PLAN_ID_HERE"}'

# Response:
# {
#   "sessionId": "cs_test_xxx",
#   "url": "https://checkout.stripe.com/..."
# }
```

**Get Active Subscription**
```bash
curl -X GET http://localhost:4000/api/subscriptions/active \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response:
# {
#   "id": "sub_xxx",
#   "userId": "user_id",
#   "status": "ACTIVE",
#   "stripeSubscriptionId": "sub_xxx",
#   "plan": { "id": "...", "name": "Growth Plan" }
# }
```

### Webhook Testing

**Simulate Webhook Event**
```bash
# Using Stripe CLI
stripe trigger checkout.session.completed

# Or manually with curl:
curl -X POST http://localhost:4000/api/payments/stripe/webhook \
  -H "Stripe-Signature: t=TIMESTAMP,v1=SIGNATURE" \
  -d '{"type":"checkout.session.completed",...}'
```

---

## Part 7: Troubleshooting

### Issue: Webhook not firing

**Solution**: 
- Ensure Stripe CLI is running with `stripe listen`
- Check that the endpoint URL is correct
- Verify webhook signing secret in `.env`
- Check backend logs for webhook errors

### Issue: "Stripe Price ID not configured"

**Solution**:
- Ensure plans have `stripePriceId` in database
- Update plan records with correct Stripe Price IDs
- Verify price exists in Stripe Dashboard

### Issue: Subscription not created after payment

**Solution**:
- Check backend logs for webhook processing errors
- Verify `customer.subscription.created` webhook fired in Stripe Dashboard
- Ensure Stripe metadata includes userId correctly

### Issue: CORS errors from frontend

**Solution**:
- Update CORS in backend `main.ts` if frontend URL is different
- Add frontend domain to allowed origins

---

## Part 8: Production Deployment

### Pre-Production Checklist

- [ ] Upgrade Stripe account to production
- [ ] Use production API keys (sk_live_xxx, pk_live_xxx)
- [ ] Configure production webhook endpoint
- [ ] Test all payment methods on live cards (small amounts)
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure email notifications for failed payments
- [ ] Test subscription renewal flow for full month
- [ ] Verify access control: premium content blocked for non-subscribers
- [ ] Set up admin dashboard to monitor subscriptions
- [ ] Configure automatic backup strategy

### Environment Variables (Production)

```
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
STRIPE_WEBHOOK_SECRET=whsec_live_YOUR_PRODUCTION_SECRET
FRONTEND_URL=https://yourdomain.com
DATABASE_URL=postgresql://user:pass@prod-db:5432/db
```

---

## Part 9: API Endpoints Reference

### Authentication Required

```
POST   /api/payments/stripe/checkout         - Create checkout session
POST   /api/subscriptions/:id/cancel-at-stripe - Cancel subscription
GET    /api/subscriptions/active             - Get active subscription
GET    /api/subscriptions/my                 - Get all user subscriptions
POST   /api/subscriptions/activate-free      - Activate free plan
```

### Webhooks (No Auth Required)

```
POST   /api/payments/stripe/webhook          - Stripe webhook endpoint
```

---

## Part 10: Success Metrics

Track these metrics to validate the implementation:

- ✅ Successful checkout sessions created
- ✅ Payment conversion rate
- ✅ Failed payment recovery rate
- ✅ Subscription renewal success rate
- ✅ Customer churn rate
- ✅ Average webhook processing time
- ✅ Zero missed webhooks

---

## Support & Documentation

- Stripe Docs: https://stripe.com/docs
- Stripe CLI: https://stripe.com/docs/stripe-cli
- Webhook Testing: https://stripe.com/docs/webhooks/test

---

**Last Updated**: 2026-06-18
**Version**: 1.0.0
**Status**: Production Ready
