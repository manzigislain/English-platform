# ⚡ Stripe Integration - Quick Start

## Current Status: ✅ BUILD SUCCESSFUL

Backend and frontend both build without errors.

---

## Next 5 Steps (Do This Now)

### Step 1: Get Stripe Test Keys (5 minutes)
1. Go to https://dashboard.stripe.com
2. Sign up or log in
3. Click "Developers" → "API keys"
4. Copy **Secret Key** (starts with `sk_test_`)
5. Copy **Publishable Key** (starts with `pk_test_`)

### Step 2: Update Backend Environment (2 minutes)
Edit `backend/.env`:
```
STRIPE_SECRET_KEY=sk_test_PASTE_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_TEMPORARILY_USE_ANY_STRING
FRONTEND_URL=http://localhost:3000
```

### Step 3: Apply Database Migration (2 minutes)
```bash
cd backend

# Windows PowerShell
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/english_platform"
npx prisma db push
```

This adds Stripe fields to Subscription, Payment, and Plan tables.

### Step 4: Start Services (2 minutes)
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

Services start at:
- Backend: http://localhost:4000
- Frontend: http://localhost:3000

### Step 5: Test Free Plan (2 minutes)
1. Open http://localhost:3000/pricing
2. Click "Get Started Free" on Seed plan
3. Check database for new subscription:
   ```sql
   SELECT id, userId, status FROM subscriptions ORDER BY createdAt DESC LIMIT 1;
   ```

---

## Test Paid Subscription (5 minutes)

### With Stripe Checkout
1. Go to http://localhost:3000/pricing
2. Click "Subscribe Now" on Growth or Success plan
3. Click "Pay with Card (Stripe)"
4. In Stripe Checkout:
   - Email: test@example.com
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
   - ZIP: `12345`
5. Click "Pay"
6. Should redirect to `/payments/success`

**What happens**:
- ✅ Payment created in database
- ✅ Subscription status set to ACTIVE
- ✅ Stripe Customer ID saved
- ✅ User gains premium access

---

## Webhook Testing (Optional - But Recommended)

### Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (use Chocolatey or download from stripe.com/docs/stripe-cli)
choco install stripe

# Then login
stripe login
```

### Forward Webhooks to Local Server
```bash
stripe listen --forward-to localhost:4000/api/payments/stripe/webhook
```

This outputs a webhook signing secret. Copy it and update `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_test_PASTE_COPIED_SECRET
```

---

## Test Webhook Delivery
```bash
# In another terminal, trigger test event
stripe trigger checkout.session.completed

# Or trigger subscription event
stripe trigger customer.subscription.created
```

Check backend logs to see webhook being processed.

---

## Database Queries for Verification

### Check Free Subscription Created
```sql
SELECT id, userId, planId, status FROM subscriptions WHERE planId = 'SEED_PLAN_ID';
```

### Check Payment After Stripe Checkout
```sql
SELECT id, userId, status, stripeCheckoutSessionId FROM payments ORDER BY createdAt DESC LIMIT 1;
```

### Check Subscription After Payment
```sql
SELECT id, userId, status, stripeSubscriptionId, currentPeriodEnd FROM subscriptions ORDER BY createdAt DESC LIMIT 1;
```

### View All Subscriptions
```sql
SELECT s.id, s.userId, s.status, s.stripeSubscriptionId, p.name as planName 
FROM subscriptions s 
LEFT JOIN plans p ON s.planId = p.id 
ORDER BY s.createdAt DESC;
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `BUILD FAILED` | Run `npm install` in both backend and frontend directories |
| `DATABASE_URL not set` | Copy the $env:DATABASE_URL line before running migrations |
| `Stripe key error` | Ensure STRIPE_SECRET_KEY starts with `sk_test_` |
| `Webhook not firing` | Make sure Stripe CLI is running with `stripe listen` |
| `Payment failed in Stripe Checkout` | Use test card `4242 4242 4242 4242` (not real card) |
| `Subscription not created` | Check backend logs - webhook handler might have errored |

---

## Expected Workflow

```
1. User logs in
   ↓
2. Visits /pricing page
   ↓
3. Clicks "Subscribe Now" → Pay with Card (Stripe)
   ↓
4. Redirected to Stripe Checkout
   ↓
5. Enters test card details
   ↓
6. Stripe processes payment
   ↓
7. Webhook fires: checkout.session.completed
   ↓
8. Backend handler creates Payment and Subscription records
   ↓
9. Webhook fires: customer.subscription.created
   ↓
10. Backend handler updates subscription with Stripe IDs
    ↓
11. User redirected to /payments/success
    ↓
12. User now has premium access ✅
```

---

## What's Implemented

✅ Stripe Checkout Session creation
✅ Real payment processing (via Stripe, not simulation)
✅ Webhook handling for 6+ event types
✅ Database synchronization
✅ Free plan support
✅ Subscription lifecycle (PENDING → ACTIVE → EXPIRED)
✅ Subscription cancellation
✅ Access control (backend enforced)

---

## Files to Review

| File | Purpose |
|------|---------|
| `backend/src/payments/stripe.service.ts` | All Stripe API calls and webhook handlers |
| `backend/src/payments/payments.controller.ts` | Stripe checkout and webhook endpoints |
| `frontend/src/app/pricing/page.tsx` | Checkout button and form |
| `backend/prisma/schema.prisma` | Database schema with Stripe fields |

---

## Getting Help

1. **Stripe Docs**: https://stripe.com/docs
2. **Test Cards**: https://stripe.com/docs/testing#cards
3. **Webhook Testing**: https://stripe.com/docs/webhooks/test
4. **Error Codes**: https://stripe.com/docs/error-codes

---

**Ready to start?** Follow the "5 Steps" section above. You'll have a working payment system in ~20 minutes! 🚀
