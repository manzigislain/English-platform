# DEPLOYMENT_GUIDE.md — Production Deployment

## Deploying to Production

### 1. Environment Variables (Production)
```env
# Database
DATABASE_URL="postgresql://user:password@production-host:5432/english-platform"

# JWT (use strong random secrets!)
JWT_SECRET="<generate-a-strong-random-secret>"
JWT_REFRESH_SECRET="<generate-another-strong-random-secret>"

# Stripe (LIVE keys, not test!)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Frontend URL
FRONTEND_URL="https://yourdomain.com"
APP_URL="https://yourdomain.com"

# Backend Port
PORT=4000
```

### 2. Backend Deployment (Node.js)

#### Option A: Direct Server
```bash
# Install dependencies
cd backend
npm install --production

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push --accept-data-loss

# Seed production data
npm run seed

# Build
npm run build

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/src/main.js --name "english-platform-api"
```

#### Option B: Docker
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 4000
CMD ["node", "dist/src/main.js"]
```

### 3. Frontend Deployment (Next.js)

#### Build for Production
```bash
cd frontend
npm install
npm run build
```

#### Deploy to Vercel (Recommended)
```bash
npm i -g vercel
vercel --prod
```

Set environment variables in Vercel:
- `NEXT_PUBLIC_API_URL` = `https://api.yourdomain.com/api`

#### Deploy to Any Static Host
```bash
npm run build
# Output in .next/ directory
# Use `next start` or deploy to Node.js hosting
```

### 4. Database Migrations

For production, use proper migrations instead of `db push`:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma migrate deploy
```

### 5. Stripe Webhook Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://api.yourdomain.com/api/payments/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.deleted`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 6. Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Set strong JWT secrets (min 32 chars)
- [ ] Use Stripe LIVE keys
- [ ] Enable rate limiting
- [ ] Set CORS to specific domain
- [ ] Run database with proper user/password
- [ ] Disable debug logging
- [ ] Set NODE_ENV=production

### 7. Monitoring

- Monitor Stripe webhook failures via dashboard
- Set up application logging (e.g., Winston, Sentry)
- Monitor database connection pool
- Set up uptime monitoring

### 8. Scaling

- Use a process manager (PM2) for Node.js
- Add database connection pooling (pgBouncer)
- Consider Redis for caching
- Use CDN for static assets
