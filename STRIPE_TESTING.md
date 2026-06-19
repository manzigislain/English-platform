# STRIPE_TESTING.md — Stripe Integration Testing Guide

## Stripe Test Cards

| Card Number | Description | Scenario |
|-------------|-------------|----------|
| 4242 4242 4242 4242 | Visa | Successful payment |
| 4000 0025 0000 3155 | Visa Requires Auth | 3D Secure authentication |
| 4000 0000 0000 3220 | Visa Decline | Card declined |
| 4000 0000 0000 9995 | Visa Insufficient Funds | Insufficient funds |
| 5555 5555 5555 4444 | Mastercard | Successful payment |
| 3782 8224 6310 005 | Amex | Successful payment |

Use any future expiry date (e.g., 12/34) and any 3-digit CVC (4-digit for Amex).

## Testing Flow

### 1. Setup Stripe CLI (for local webhook testing)
```bash
# Install Stripe CLI
# Download from: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks to local backend
stripe listen --forward-to http://localhost:4000/api/payments/stripe/webhook

# Copy the webhook signing secret (whsec_...) to your .env
```

### 2. Test Successful Payment
1. Go to http://localhost:3000/pricing
2. Select "Growth" plan
3. Click "Pay with Card (Stripe)"
4. You'll be redirected to Stripe Checkout
5. Enter card: `4242 4242 4242 4242`
6. Any future date, any CVC
7. Complete payment
8. You should be redirected to `/payments/success`
9. The page polls and shows "Payment Successful"
10. Check `/billing` for active subscription

### 3. Test Failed Payment
1. Go to http://localhost:3000/pricing
2. Select "Growth" plan
3. Click "Pay with Card (Stripe)"
4. Enter card: `4000 0000 0000 3220`
5. Complete payment - card will be declined
6. You'll see the error at checkout

### 4. Test Subscription Cancellation
1. After successful subscription, go to `/billing`
2. Click "Cancel at Period End"
3. Subscription continues until period end
4. Can click "Resume Subscription" to restore

### 5. Test Webhook Events Manually
```bash
# Trigger checkout.session.completed
stripe trigger checkout.session.completed

# Trigger customer.subscription.created
stripe trigger customer.subscription.created

# Trigger customer.subscription.deleted
stripe trigger customer.subscription.deleted

# Trigger invoice.paid
stripe trigger invoice.paid

# Trigger invoice.payment_failed
stripe trigger invoice.payment_failed
```

### 6. Test Customer Portal
1. After subscription, go to `/billing`
2. Click "Stripe Portal"
3. You'll be redirected to Stripe-hosted portal
4. Test: update payment method, cancel, view invoices

### 7. Verify Database Records
```bash
# Check payments
curl http://localhost:4000/api/payments/my \
  -H "Authorization: Bearer <token>"

# Check invoices
curl http://localhost:4000/api/payments/invoices/my \
  -H "Authorization: Bearer <token>"

# Check subscription
curl http://localhost:4000/api/subscriptions/active \
  -H "Authorization: Bearer <token>"
```

## Stripe Dashboard Links
- **Test Dashboard:** https://dashboard.stripe.com/test/dashboard
- **Webhooks:** https://dashboard.stripe.com/test/webhooks
- **Products:** https://dashboard.stripe.com/test/products
- **Customers:** https://dashboard.stripe.com/test/customers
- **Payments:** https://dashboard.stripe.com/test/payments

## Common Issues

### Webhook not received
- Ensure Stripe CLI is running: `stripe listen --forward-to localhost:4000/api/payments/stripe/webhook`
- Check webhook logs: `GET /api/admin/webhook-events`

### Payment not completing
- Check Stripe dashboard for the payment status
- Check backend logs for webhook processing errors
- Verify `STRIPE_WEBHOOK_SECRET` matches the CLI output

### Subscription not activating
- Check `WebhookEvent` table in database
- Verify Stripe Price IDs match plans in database
- Check that `metadata.userId` and `metadata.planId` are passed correctly
