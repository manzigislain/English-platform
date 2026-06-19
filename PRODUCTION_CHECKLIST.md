# PRODUCTION_CHECKLIST.md

## Pre-Launch Checklist

### Environment & Configuration
- [ ] `STRIPE_SECRET_KEY` set to LIVE key (not test)
- [ ] `STRIPE_PUBLISHABLE_KEY` set to LIVE key
- [ ] `STRIPE_WEBHOOK_SECRET` set to LIVE webhook secret
- [ ] `JWT_SECRET` is a strong random string (32+ chars)
- [ ] `DATABASE_URL` points to production database
- [ ] `FRONTEND_URL` set to production domain
- [ ] `NODE_ENV=production` set
- [ ] OpenAI API key set (if using TTS/transcription)

### Security
- [ ] HTTPS enabled (SSL certificate installed)
- [ ] CORS restricted to production domain only
- [ ] Rate limiting configured (already set: 100 req/min)
- [ ] All API endpoints have proper auth guards
- [ ] Webhook signature verification enabled
- [ ] JWT token expiration set appropriately (15min access + refresh)
- [ ] No placeholder values in .env

### Stripe Integration
- [ ] Stripe webhook endpoint configured in Stripe Dashboard
- [ ] All 7 webhook events subscribed
- [ ] Webhook signing secret copied to .env
- [ ] Stripe Price IDs linked to plans in database
- [ ] Test payment with test card 4242 4242 4242 4242
- [ ] Test subscription cancellation flow
- [ ] Test invoice generation
- [ ] Test customer portal flow
- [ ] Test failed payment handling

### Database
- [ ] Production database created and migrated
- [ ] Database backups configured
- [ ] Database connection pooling configured
- [ ] Production plans seeded with Stripe Price IDs
- [ ] Admin user created (or removed if not needed)

### Frontend
- [ ] Production build succeeds (`next build`)
- [ ] All pages render correctly
- [ ] API URL points to production backend
- [ ] Payment success page redirects correctly
- [ ] Billing page loads subscription data
- [ ] Student dashboard shows premium status
- [ ] Admin dashboard loads payment data

### Monitoring
- [ ] Application error logging configured
- [ ] Stripe webhook failure monitoring setup
- [ ] Database health monitoring
- [ ] Server uptime monitoring

### Performance
- [ ] Frontend assets optimized (Next.js handles this)
- [ ] Database indexes created (Prisma handles this)
- [ ] API response times acceptable
- [ ] Static pages pre-rendered

### Final Verification
- [ ] Full user registration flow works
- [ ] Free plan activation works
- [ ] Paid subscription (Stripe) flow works
- [ ] Webhook triggers subscription activation
- [ ] Premium content access works
- [ ] Subscription cancellation works
- [ ] Admin can view all payments
- [ ] Admin dashboard shows correct stats
- [ ] Invoices generated correctly
- [ ] Customer portal accessible
