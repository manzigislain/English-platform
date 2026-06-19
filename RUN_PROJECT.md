# RUN_PROJECT.md — English Learning Platform

## Quick Start

### 1. Prerequisites
- **Node.js** v18+ (v22.19.0 recommended)
- **npm** v9+
- **PostgreSQL** 14+ running on localhost:5432

### 2. Database Setup
```bash
# Create database (if not exists)
createdb -U postgres english-platform

# Navigate to backend
cd backend

# Set DATABASE_URL
export DATABASE_URL="postgresql://postgres@localhost:5432/english-platform"
# (Windows CMD: set DATABASE_URL=postgresql://postgres@localhost:5432/english-platform)
```

### 3. Environment Variables
Copy the `.env` file in `backend/` and configure your keys:

```env
DATABASE_URL="postgresql://postgres@localhost:5432/english-platform"
JWT_SECRET="english-platform-jwt-secret-key"
STRIPE_SECRET_KEY="sk_test_YOUR_STRIPE_SECRET_KEY"
STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_STRIPE_PUBLISHABLE_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
FRONTEND_URL="http://localhost:3000"
PORT=4000
OPENAI_API_KEY=""  # Optional, for TTS features
```

### 4. Install & Build
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run seed          # Seeds content + admin user
npx ts-node prisma/seed-plans.ts  # Seeds subscription plans
npx nest build

# Frontend
cd frontend
npm install
npx next build
```

### 5. Start the Application
```bash
# Terminal 1 - Backend
cd backend
DATABASE_URL="postgresql://postgres@localhost:5432/english-platform" node dist/src/main.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 6. Access the Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000/api
- **Admin Login:** http://localhost:3000/auth/login

### 7. Default Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@englishplatform.com | admin123 |

### 8. API Endpoints

#### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login |
| GET | /api/courses | List all courses |
| GET | /api/courses/:id | Get course details |
| GET | /api/subscriptions/plans | List subscription plans |
| POST | /api/payments/stripe/webhook | Stripe webhook |

#### Authenticated Endpoints (Bearer Token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/auth/profile | Get user profile |
| GET | /api/subscriptions/my | Get user subscriptions |
| GET | /api/subscriptions/active | Get active subscription |
| POST | /api/subscriptions/activate-free | Activate free plan |
| POST | /api/payments/stripe/checkout | Create Stripe checkout session |
| POST | /api/payments/stripe/portal | Create customer portal session |
| GET | /api/payments/invoices/my | Get user invoices |
| GET | /api/payments/my | Get user payment history |

#### Admin Endpoints (ADMIN role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/dashboard | Dashboard statistics |
| GET | /api/admin/users | List users |
| GET | /api/admin/payments | List payments |
| GET | /api/admin/invoices | List invoices |
| GET | /api/admin/webhook-events | List webhook events |
| GET | /api/admin/subscription-history | List subscription history |
| POST | /api/admin/payments/:id/approve | Approve bank transfer |

### 9. Stripe Webhook URL
For local development with Stripe CLI:
```
stripe listen --forward-to http://localhost:4000/api/payments/stripe/webhook
```

Webhook endpoint: `POST http://localhost:4000/api/payments/stripe/webhook`

### 10. Database Tables
- users
- levels, courses, units, lessons
- vocabularies, vocabulary_audio
- plans, subscriptions, subscription_history
- payments, invoices, payment_receipts, payment_transactions
- webhook_events
- community_posts, comments, likes, reports
- badges, achievements, user_badges, user_achievements
- leaderboard, streak_history
- certificates, certificate_verifications
- exercises, progress, lesson_attempts
- writing/speaking/listening/reading/pronunciation tables
- quizzes, quiz_questions, quiz_attempts
- dialogues, dialogue_lines
- media
- scholarship_codes
