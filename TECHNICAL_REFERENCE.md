# 🔧 Implementation Details - Technical Reference

## Architecture Decisions

### 1. Webhook-Driven Architecture
**Decision**: All subscription state changes driven by Stripe webhooks, NOT frontend responses

**Rationale**:
- Frontend is untrusted (user can manipulate JavaScript)
- Webhooks are cryptographically signed and verified
- Webhook events are the source of truth from Stripe
- Eliminates race conditions and payment fraud

**Implementation**:
```typescript
// Frontend NEVER controls subscription status
// Example: Bad approach (DO NOT USE)
// if (stripeResponse.success) {
//   subscription.status = 'ACTIVE';  // ❌ WRONG
// }

// Correct approach: Wait for webhook
POST /api/payments/stripe/webhook
├─ Verify signature ✅
├─ Check event type
└─ Update database based on Stripe source of truth ✅
```

### 2. Stripe-Hosted Checkout Only
**Decision**: No payment form in our app, redirect to Stripe Checkout

**Rationale**:
- Stripe Checkout handles all PCI compliance
- No card data touches our servers
- Eliminates entire class of security vulnerabilities
- Stripe handles 3D Secure automatically
- Users trust Stripe (they know the brand)

**Implementation**:
```typescript
// User clicks "Subscribe"
createCheckoutSession()
  ├─ Call Stripe API to create session
  ├─ Get secure Stripe Checkout URL
  └─ Redirect browser to https://checkout.stripe.com/...

// User completes payment on Stripe servers
// Our app only receives webhook notification
```

### 3. Database as Source of Truth
**Decision**: Subscription database record is the authoritative source for user access control

**Rationale**:
- Survive server restarts
- Enable offline lookups
- Audit trail of changes
- No dependency on Stripe being online
- Easy admin access

**Implementation**:
```sql
-- When user accesses premium content
SELECT status FROM subscriptions 
WHERE userId = ? 
  AND status = 'ACTIVE' 
  AND currentPeriodEnd > NOW();
  
-- If result exists: User has access ✅
-- If result empty: Access denied ✅
```

### 4. Idempotent Webhook Handlers
**Decision**: All webhook handlers are safe to run multiple times

**Rationale**:
- Stripe retries webhooks if we don't respond with 200 OK
- Network could drop our response (but we processed it)
- Database operations must be idempotent (safe on retry)

**Implementation**:
```typescript
// Webhook handler structure
async handleCheckoutSessionCompleted(event) {
  const sessionId = event.data.object.id;
  
  // Check if already processed
  const existingPayment = await db.payment.findUnique({
    where: { stripeCheckoutSessionId: sessionId }
  });
  
  if (existingPayment) {
    // Already processed - this is a retry
    // Return 200 OK without double-processing
    return;
  }
  
  // First time seeing this event - process it
  const payment = await db.payment.create({
    data: { stripeCheckoutSessionId: sessionId, ... }
  });
}
```

---

## Data Flow Diagrams

### Free Plan Activation
```
User clicks "Get Started Free"
         ↓
POST /api/subscriptions/activate-free
         ↓
Backend verifies user logged in
         ↓
Create Subscription record locally:
├─ status: ACTIVE
├─ planId: SEED
├─ currentPeriodEnd: +10 years
└─ stripeSubscriptionId: NULL (not needed)
         ↓
User immediately has access ✅
No Stripe interaction needed
No webhooks fired
```

### Paid Plan Checkout
```
User clicks "Subscribe Now" → "Pay with Card (Stripe)"
         ↓
Frontend calls: POST /api/payments/stripe/checkout
         ↓
Backend verifies:
├─ User logged in (JWT)
├─ Plan exists and has stripePriceId
└─ User can subscribe
         ↓
Backend calls Stripe API:
create stripe.checkout.sessions.create({
  customer_email: user.email,
  line_items: [{
    price: plan.stripePriceId,  // e.g., price_xxx_monthly
    quantity: 1
  }],
  success_url: frontend_url + '/payments/success',
  cancel_url: frontend_url + '/payments/cancel'
})
         ↓
Stripe returns: { id: 'cs_test_xxx', url: 'https://...' }
         ↓
Backend returns URL to frontend
         ↓
Frontend redirects browser to https://checkout.stripe.com/...
         ↓
User completes payment on Stripe servers
(All security handled by Stripe)
         ↓
[CASE 1: Success]
Stripe processes payment
         └─ Creates Stripe Customer (cus_xxx)
         └─ Creates Stripe Subscription (sub_xxx)
         └─ Fires webhook: checkout.session.completed
         └─ Fires webhook: customer.subscription.created

[CASE 2: Cancelled]
User closes Stripe Checkout
         └─ Browser redirected to /payments/cancel
         └─ No webhook fired (no payment attempted)
         
[CASE 3: Declined]
Stripe declines payment
         └─ Checkout shows error
         └─ User can retry or cancel
         └─ No webhook fired (not completed)
```

### Webhook Processing
```
[1] Stripe Event Fired
    ├─ Type: customer.subscription.created
    ├─ ID: evt_xxx (unique event ID)
    ├─ Data: { object: { id: 'sub_xxx', ... } }
    └─ Signature: t=timestamp,v1=sha256_hash

         ↓

[2] Stripe sends HTTPS POST to /api/payments/stripe/webhook
    Header: Stripe-Signature: t=...,v1=...

         ↓

[3] Backend webhook handler
    ├─ Extract Stripe-Signature header
    ├─ Get request raw body (NOT parsed JSON!)
    ├─ Verify signature:
    │  - Compute HMAC-SHA256(raw_body, webhook_secret)
    │  - Compare with v1 from header
    │  - Reject if mismatch ✅ SECURITY
    └─ Signature valid? Continue...

         ↓

[4] Check event type
    ├─ checkout.session.completed → handleCheckoutSessionCompleted()
    ├─ customer.subscription.created → handleSubscriptionCreated()
    ├─ customer.subscription.updated → handleSubscriptionUpdated()
    ├─ invoice.paid → handleInvoicePaid()
    └─ etc...

         ↓

[5] Database operation
    (e.g., for customer.subscription.created)
    ├─ Extract stripeSubscriptionId from webhook
    ├─ Check if subscription already exists
    │  └─ If yes: This is a retry, return 200 OK
    ├─ Lookup Stripe Customer from subscription
    ├─ Lookup user by customerEmail
    ├─ Lookup plan by stripePriceId
    ├─ Create Subscription record:
    │  ├─ userId
    │  ├─ planId
    │  ├─ stripeSubscriptionId: sub_xxx
    │  ├─ stripeCustomerId: cus_xxx
    │  ├─ stripePriceId: price_xxx
    │  ├─ currentPeriodStart: (from Stripe * 1000)
    │  ├─ currentPeriodEnd: (from Stripe * 1000)
    │  ├─ status: ACTIVE
    │  └─ createdAt: now()
    └─ Subscription record now in database ✅

         ↓

[6] Return response
    ├─ Return 200 OK with { received: true }
    └─ Stripe confirms delivery

         ↓

[7] User now has premium access
    ├─ Backend checks subscription status
    ├─ status = ACTIVE AND currentPeriodEnd > now()
    └─ Access granted ✅
```

### Subscription Renewal
```
[Day 1] 
User subscribes, status = ACTIVE
currentPeriodEnd = 2026-07-18

         ↓

[Day 31]
Stripe charges customer (recurring subscription)
Stripe creates new invoice
Payment succeeds
         └─ Fires webhook: invoice.paid

         ↓

[Backend processes invoice.paid webhook]
├─ Extract stripeSubscriptionId from invoice
├─ Lookup existing Subscription record
├─ Get Stripe Subscription object to find new dates:
│  ├─ current_period_start: 1689710400 (unix timestamp)
│  ├─ current_period_end: 1692388800
│  └─ status: "active"
├─ Update Subscription record:
│  ├─ currentPeriodStart: 1689710400 * 1000 (convert to ms)
│  ├─ currentPeriodEnd: 1692388800 * 1000
│  ├─ status: ACTIVE (still active)
│  └─ updatedAt: now()
└─ Database reflects new renewal period ✅

         ↓

[Day 32+]
User still has access
currentPeriodEnd = 2026-08-18 (extended)
Cycle continues...
```

### Subscription Cancellation
```
[Case 1: Cancel at Period End]
User clicks "Cancel Subscription"
         ↓
POST /api/subscriptions/:id/cancel-at-stripe
         ↓
Backend calls:
stripe.subscriptions.update(stripeSubscriptionId, {
  cancel_at_period_end: true
})
         ↓
Stripe returns updated subscription with:
├─ cancel_at_period_end: true
├─ status: "active" (still active!)
└─ will cancel on: currentPeriodEnd
         ↓
Backend updates local record:
├─ cancelAtPeriodEnd: true
└─ status: ACTIVE (remains active until period end)
         ↓
User can still access premium content
(They paid for the full period)
         ↓
[On Period End Date]
Stripe automatically stops billing
Stripe fires webhook: customer.subscription.deleted
(or customer.subscription.updated with status: "canceled")
         ↓
Backend handler receives webhook:
├─ Update Subscription record:
│  ├─ status: EXPIRED  (or CANCELLED)
│  └─ updatedAt: now()
└─ Access revoked for this user ✅
         ↓
Next time user accesses premium content:
├─ Query: SELECT * FROM subscriptions WHERE userId=?
├─ Result empty (subscription now EXPIRED)
└─ Access denied ✅

[Case 2: Cancel Immediately]
User clicks "Cancel Now"
         ↓
POST /api/subscriptions/:id/cancel-at-stripe with immediate=true
         ↓
Backend calls:
stripe.subscriptions.del(stripeSubscriptionId)
         ↓
Stripe immediately cancels subscription:
├─ status: "canceled"
└─ No refund (depends on your policy)
         ↓
Stripe fires webhook: customer.subscription.deleted
         ↓
Backend handler:
├─ status: CANCELLED
└─ Access revoked immediately ✅
```

---

## Database Schema Deep Dive

### Subscription Model Relations
```
Subscription
├─ user: User (many-to-one)
│  └─ userId: foreign key
├─ plan: Plan (many-to-one)
│  └─ planId: foreign key
├─ payments: Payment[] (one-to-many)
│  └─ subscriptionId: foreign key in Payment
└─ Unique constraints:
   ├─ @@unique([userId, planId]) - One subscription per user per plan
   └─ @@unique(stripeSubscriptionId) - Prevent duplicates from Stripe
```

### Key Fields
```typescript
// Subscription tracking
status: PENDING | ACTIVE | EXPIRED | CANCELLED
  └─ PENDING: Created but not yet charged
  └─ ACTIVE: User has access
  └─ EXPIRED: Period ended or payment failed
  └─ CANCELLED: User cancelled subscription

// Stripe integration
stripeCustomerId: "cus_xxx"
  └─ Maps to Stripe Customer record
  
stripeSubscriptionId: "sub_xxx" (UNIQUE)
  └─ Maps to Stripe Subscription
  └─ Unique prevents duplicate subscriptions
  └─ Used to cancel, update, or query from Stripe
  
stripePriceId: "price_xxx"
  └─ The recurring price this subscription uses
  
stripeProductId: "prod_xxx"
  └─ The product (plan) this subscription is for

// Period tracking (Unix timestamps in milliseconds)
currentPeriodStart: DateTime (e.g., "2026-06-18T00:00:00Z")
  └─ When current billing period started
  
currentPeriodEnd: DateTime (e.g., "2026-07-18T00:00:00Z")
  └─ When current billing period ends
  └─ Used to check: status = ACTIVE AND currentPeriodEnd > now()
  
cancelAtPeriodEnd: Boolean
  └─ true: Subscription scheduled to end on currentPeriodEnd
  └─ false: Subscription active with auto-renewal
```

---

## Key Implementation Files

### stripe.service.ts (Core Engine - 350+ lines)

**Method: createCheckoutSession()**
```typescript
// Input: userId, planId
// Process:
// 1. Get/create Stripe Customer for user
// 2. Get plan with stripePriceId
// 3. Call stripe.checkout.sessions.create()
// 4. Create local Payment record (PENDING)
// 5. Return { sessionId, url }
// Output: Checkout session URL
```

**Method: handleCheckoutSessionCompleted()**
```typescript
// Triggered by: checkout.session.completed webhook
// Process:
// 1. Extract sessionId from webhook
// 2. Check if Payment already exists
// 3. Mark Payment as COMPLETED
// 4. Wait for subscription.created webhook to create Subscription
// Note: Subscription created by different webhook
```

**Method: handleSubscriptionCreated()**
```typescript
// Triggered by: customer.subscription.created webhook
// Process:
// 1. Extract stripeSubscriptionId, stripeCustomerId
// 2. Get user by stripeCustomerId
// 3. Get plan by stripePriceId
// 4. Create Subscription record with all Stripe fields
// 5. Status: ACTIVE
// Result: User now has access
```

**Method: handleSubscriptionUpdated()**
```typescript
// Triggered by: customer.subscription.updated webhook
// Process:
// 1. Get existing Subscription by stripeSubscriptionId
// 2. Update currentPeriodStart/End from webhook
// 3. Update status based on Stripe status
// 4. Handle cancelAtPeriodEnd flag
// Result: Period dates and state stay in sync
```

**Method: handleInvoicePaid()**
```typescript
// Triggered by: invoice.paid webhook
// Process:
// 1. Extract stripeSubscriptionId from invoice
// 2. Get Subscription record
// 3. Get fresh subscription data from Stripe
// 4. Update currentPeriodStart/End (new renewal period)
// 5. Create Payment record for this invoice
// 6. Update Payment status to PAID
// Result: Renewal tracked in database
```

**Method: verifyWebhookSignature()**
```typescript
// Input: raw request body, signature header, webhook secret
// Process:
// 1. Extract timestamp and signature from header
// 2. Compute HMAC-SHA256(body, secret)
// 3. Compare with provided signature
// 4. Reject if mismatch
// Security: Prevents forgery, replays
```

---

## Access Control Enforcement

### How Premium Content is Protected

```typescript
// In any endpoint serving premium content

// Method 1: Subscription Guard (Decorator)
@Get('/lessons/advanced')
@UseGuards(SubscriptionGuard)  // ← Checks access automatically
async getAdvancedLessons() {
  // Only subscribed users reach here
}

// Method 2: Manual Check
@Get('/courses/premium/:id')
async getPremiumCourse(@Req() req: any) {
  const userId = req.user.id;
  
  const subscription = await db.subscription.findUnique({
    where: { userId },
    include: { plan: true }
  });
  
  if (!subscription 
    || subscription.status !== 'ACTIVE'
    || subscription.currentPeriodEnd < new Date()) {
    throw new ForbiddenException('No active subscription');
  }
  
  // User has access, proceed
  return course;
}

// Method 3: Database Query
@Get('/profile/premium-features')
async getPremiumFeatures(@Req() req: any) {
  const hasAccess = await db.subscription.count({
    where: {
      userId: req.user.id,
      status: 'ACTIVE',
      currentPeriodEnd: { gt: new Date() }
    }
  });
  
  if (hasAccess === 0) {
    throw new ForbiddenException('Premium access required');
  }
  
  return { features: [...] };
}
```

**Why This Matters**:
- ✅ Backend enforced (user can't modify frontend to bypass)
- ✅ Database checks current state (not cached token)
- ✅ Period end checked (old subscriptions blocked)
- ✅ Status verified (cancelled subscriptions revoked)

---

## Testing Scenarios

### Scenario 1: Successful Payment
```bash
# Setup
Start backend + frontend
Log in as test user
Go to /pricing

# Actions
Click "Subscribe Now" on Growth plan
Click "Pay with Card (Stripe)"

# In Stripe Checkout
Email: test@example.com
Card: 4242 4242 4242 4242
Expiry: 12/25
CVC: 123

Click "Pay"

# Expected
- Redirect to /payments/success
- Database: Payment.status = COMPLETED
- Database: Subscription.status = ACTIVE
- Backend logs: Webhooks processed successfully
- User can access premium content
```

### Scenario 2: Failed Payment
```bash
# Setup
Same as Scenario 1

# In Stripe Checkout
Email: test@example.com
Card: 4000 0000 0000 0002 (decline)
...rest same

# Expected
- Stripe shows decline error
- Redirect to /payments/cancel
- Database: No Payment created OR Payment.status = FAILED
- No Subscription created
- User can NOT access premium content
```

### Scenario 3: User Cancels at Checkout
```bash
# Setup
Same as Scenario 1

# Actions
In Stripe Checkout, click browser back button

# Expected
- Redirect to /payments/cancel
- No Payment created
- No Subscription created
- Backend logs: No webhooks fired
```

### Scenario 4: Subscription Renewal
```bash
# Setup
1. Create subscription (from Scenario 1)
2. Verify: status = ACTIVE, currentPeriodEnd = 2026-07-18

# Simulation (Using Stripe Test Clock)
1. Go to Stripe Dashboard > Test Clocks
2. Create test clock set to 1 day before renewal
3. Use that clock for this subscription
4. Fast-forward to after renewal date

# Expected
- Stripe charges customer
- Stripe fires invoice.paid webhook
- Backend handler processes it
- Database: currentPeriodStart updated
- Database: currentPeriodEnd updated (now 2026-08-18)
- User still has access
```

### Scenario 5: Cancel at Period End
```bash
# Setup
1. Create subscription (active)
2. Call POST /subscriptions/:id/cancel-at-stripe with period-end option

# Expected
- Database: cancelAtPeriodEnd = true
- Database: status = ACTIVE (still active!)
- Stripe: cancel_at_period_end = true
- User can still access until period end
- On period end: Stripe cancels, webhook fires, status = CANCELLED
- User loses access
```

---

## Common Pitfalls to Avoid

### ❌ DON'T: Trust Frontend for Subscription Status
```typescript
// WRONG
const isSubscribed = await frontend.getSubscriptionStatus();
if (isSubscribed) {
  grantPremiumAccess(); // ❌ User can fake this
}

// RIGHT
const subscription = await db.subscription.findUnique({
  where: { userId }
});
if (subscription?.status === 'ACTIVE' && subscription.currentPeriodEnd > now()) {
  grantPremiumAccess(); // ✅ Database source of truth
}
```

### ❌ DON'T: Process Webhooks Without Signature Verification
```typescript
// WRONG
@Post('/webhook')
async handleWebhook(@Body() event) {
  // Anyone can call this with fake events! ❌
  updateDatabase(event);
}

// RIGHT
@Post('/webhook')
async handleWebhook(@Req() req) {
  const verified = verifyWebhookSignature(
    req.rawBody,
    req.headers['stripe-signature'],
    WEBHOOK_SECRET
  );
  if (!verified) throw new Error('Invalid signature'); // ✅
  
  const event = JSON.parse(req.rawBody);
  updateDatabase(event);
}
```

### ❌ DON'T: Store Card Data
```typescript
// WRONG
const payment = {
  cardNumber: '4242424242424242',
  expiry: '12/25',
  cvc: '123'
};
await db.payment.create(payment); // ❌ PCI violation!

// RIGHT
// Use Stripe Checkout - never touch card data
// Stripe handles all card data securely
// We only get confirmation webhooks
```

### ❌ DON'T: Hardcode Stripe IDs
```typescript
// WRONG
const stripePriceId = 'price_123abc'; // Hardcoded ❌
await createCheckout(stripePriceId);

// RIGHT
const plan = await db.plan.findUnique({ where: { id: planId } });
const stripePriceId = plan.stripePriceId; // From database ✅
await createCheckout(stripePriceId);
```

### ❌ DON'T: Process Webhooks Without Idempotency
```typescript
// WRONG
@Post('/webhook')
async handleCheckoutCompleted(event) {
  // No check for duplicates!
  const payment = await db.payment.create(event); // ❌ Creates duplicate
}

// RIGHT
@Post('/webhook')
async handleCheckoutCompleted(event) {
  const sessionId = event.data.object.id;
  
  // Idempotent: only process if new
  const existing = await db.payment.findUnique({
    where: { stripeCheckoutSessionId: sessionId }
  });
  
  if (existing) {
    return; // Already processed ✅
  }
  
  const payment = await db.payment.create({ ... });
}
```

---

## Performance Considerations

### Database Queries
```sql
-- Optimize these common queries:

-- 1. Check user has access (FREQUENT)
CREATE INDEX idx_subscriptions_userId_status_period
ON subscriptions(userId, status, currentPeriodEnd);

-- 2. Find subscription by Stripe ID (FREQUENT)
CREATE UNIQUE INDEX idx_subscriptions_stripeSubscriptionId
ON subscriptions(stripeSubscriptionId);

-- 3. Find customer by Stripe ID (FREQUENT on webhook)
CREATE INDEX idx_subscriptions_stripeCustomerId
ON subscriptions(stripeCustomerId);
```

### Webhook Processing
- ✅ Process synchronously (don't queue)
- ✅ Keep handlers fast (<100ms)
- ✅ Return 200 OK immediately
- ✅ Don't do heavy computation
- ✅ Database operations are fine (indexed)

### API Responses
- ✅ Cache active subscriptions (in-memory for 60s)
- ✅ Don't reload from Stripe unnecessarily
- ✅ Trust local database for access control
- ✅ Query Stripe only for updates/management

---

## Monitoring & Debugging

### Key Metrics to Track
```
- Webhook delivery success rate (target: 100%)
- Webhook processing latency (target: <100ms)
- Payment success rate (target: >95%)
- Subscription activation time (target: <5s)
- Database query latency (target: <10ms)
```

### Logs to Monitor
```
[Webhook Received] event_type=customer.subscription.created id=evt_xxx
[Signature Verified] timestamp=1718716800 status=valid
[Database Updated] subscription_id=sub_xxx status=ACTIVE
[Access Granted] user_id=user_123 premium_until=2026-07-18
```

### Error Handling
```
[Error: Invalid Signature] 
  → Return 400 Bad Request
  → Stripe retries webhook
  
[Error: User Not Found]
  → Return 200 OK (webhook delivered)
  → Log error for investigation
  → Don't fail the webhook
  
[Error: Database Connection]
  → Return 500 Internal Error
  → Stripe retries webhook
  → Fix database connection
```

---

**This document provides the architectural foundations for the Stripe integration.**

For implementation questions, refer to the code in `backend/src/payments/stripe.service.ts`.
For API usage, refer to `frontend/src/lib/api.ts`.
For setup instructions, refer to `STRIPE_INTEGRATION_GUIDE.md`.
