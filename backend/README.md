# LifeDesk Backend - Express.js In-Memory Server

A standalone Express.js backend server that replaces the Deno serverless functions from the Base44 BaaS platform. Features complete in-memory data storage and integrations with Stripe, Plaid, and Anthropic APIs.

## Quick Start

### Installation

```bash
cd backend
npm install
cp .env.example .env
```

### Configuration

Edit `.env` with your values:

```env
PORT=3001
JWT_SECRET=your-long-random-secret-key-min-32-chars
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLUS_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
PLAID_CLIENT_ID=...
PLAID_SECRET=...
ANTHROPIC_API_KEY=sk-ant-...
MAKE_BACKUP_WEBHOOK_URL=https://...
FRONTEND_URL=http://localhost:3000
```

### Start the Server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3001` by default.

---

## Architecture

### In-Memory Database

All data is stored in memory using a simple key-value store (`db/index.js`). Data is lost on server restart.

**Key Methods:**

- `db.list(entity)` - Get all records of an entity
- `db.filter(entity, conditions)` - Get records matching conditions
- `db.read(entity, id)` - Get single record by ID
- `db.create(entity, data)` - Create record
- `db.update(entity, id, data)` - Update record
- `db.delete(entity, id)` - Delete record
- `db.bulkCreate(entity, records)` - Batch create

### API Endpoints

#### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user
- `PUT /auth/me` - Update current user

#### Entity CRUD (All require authentication)

- `GET /entities/:entity` - List user's records
- `POST /entities/:entity/filter` - Filter with conditions
- `POST /entities/:entity` - Create record
- `GET /entities/:entity/:id` - Get single record
- `PUT /entities/:entity/:id` - Update record
- `DELETE /entities/:entity/:id` - Delete record
- `POST /entities/:entity/bulk` - Batch create

#### Business Functions

- `POST /functions/aiHealthChat` - AI assistant (pro+)
- `POST /functions/createCheckoutSession` - Start Stripe checkout
- `POST /functions/createBillingPortalSession` - Open Stripe portal
- `POST /functions/stripeWebhook` - Stripe webhook handler
- `POST /functions/deleteAccount` - Delete user account
- `POST /functions/plaid` - Plaid bank integration actions
- `POST /functions/validateStorageUpload` - Check storage limits
- `POST /functions/summarizeMedicalDocument` - AI document summary (pro+)
- `POST /functions/syncSubscriptionFromStripe` - Sync subscriptions
- `POST /functions/downgradeToPlan` - Downgrade subscription
- `GET /functions/getExchangeRates` - Get currency rates
- `POST /functions/weeklyRevenueReport` - Generate revenue report
- `POST /functions/backfillSubscriptions` - Admin: sync Stripe
- `POST /functions/backupNow` - Admin: backup data
- `POST /functions/cleanupSubscriptions` - Admin: cleanup duplicates
- `GET /functions/analyzeSubscriptionDuplicates` - Admin: analyze dupes
- `POST /functions/adminSetUserTier` - Admin: set subscription tier
- `POST /functions/adminClearDeletedFields` - Admin: clear soft-delete flags
- `GET /functions/debugServiceRole` - Debug: list all records
- `POST /functions/debugSubscriptionByEmail` - Debug: check subscription
- `GET /functions/debugSubscriptionStatus` - Debug: check own subscription
- `POST /functions/testDeleteAccountScenarios` - Admin: test deletion

---

## Supported Entities

All 30 entities from the frontend are supported with in-memory storage:

**Core Business**

- Task, Goal, Problem, Event
- Business, Project, Client
- Hobby, LearningItem, Contact

**Finance**

- Income, Expense
- RecurringIncome, RecurringExpense
- OfflineAccount, BankBalanceSnapshot

**Health**

- BodyMeasurement, Workout, ProgressPhoto, MedicalDocument

**Assets & Subscriptions**

- TangibleAsset, Subscription

**Marketing**

- MarketingStrategy, MarketingCampaign
- Idea, ContentIdea

**Time & Notes**

- TimeEntry, Note, WorkoutPlan

**Community**

- CommunityComment

---

## Authentication

All endpoints except `/auth/register`, `/auth/login`, `/functions/getExchangeRates`, `/functions/debugServiceRole`, `/functions/stripeWebhook`, and `/functions/weeklyRevenueReport` require a valid JWT token.

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**JWT Payload:**

```json
{
  "userId": "uuid",
  "iat": 1234567890,
  "exp": 1234654290
}
```

Token expiry: 30 days

---

## Row-Level Security (RLS)

The backend enforces RLS: non-admin users can only access records they created (`created_by === req.user.id`).

### Ownership Fields

All CRUD operations automatically set/check `created_by` field to ensure users only see their own data.

---

## External Integrations

### Stripe

- Checkout sessions, billing portal
- Subscription webhooks (create, update, cancel)
- Full subscription management

**Required Env Vars:**

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PLUS_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`

### Plaid

- Bank connection linking
- Transaction history
- Account balances
- Daily snapshots

**Required Env Vars:**

- `PLAID_CLIENT_ID`
- `PLAID_SECRET`

### Anthropic (Claude)

- Health chat with full context
- Medical document summarization
- Vision-capable image analysis

**Required Env Vars:**

- `ANTHROPIC_API_KEY`

---

## Testing API Endpoints

### Register & Login

```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","full_name":"Test User"}'

# Response: { "token": "eyJ...", "user": { ... } }

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Copy the token
export TOKEN="eyJ..."
```

### Create Entity

```bash
curl -X POST http://localhost:3001/entities/Task \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Task","category":"health_body"}'
```

### Get User's Records

```bash
curl -X GET http://localhost:3001/entities/Task \
  -H "Authorization: Bearer $TOKEN"
```

### Get Exchange Rates (No Auth)

```bash
curl -X GET http://localhost:3001/functions/getExchangeRates
```

---

## File Structure

```
backend/
├── server.js                      # Express app + route registration
├── package.json                   # Dependencies
├── .env.example                   # Environment template
├── db/
│   └── index.js                   # In-memory database engine
├── middleware/
│   ├── auth.js                    # JWT verification
│   └── adminAuth.js               # Admin role check
├── schemas/                       # Entity field definitions (30 files)
│   ├── User.js
│   ├── Task.js
│   ├── Goal.js
│   └── ...
├── routes/
│   ├── auth.js                    # Register, login, user profile
│   ├── entities.js                # Generic CRUD for all entities
│   └── functions/                 # Business logic functions (22 files)
│       ├── aiHealthChat.js
│       ├── createCheckoutSession.js
│       ├── stripeWebhook.js
│       ├── plaid.js
│       └── ...
└── README.md                      # This file
```

---

## Important Notes

### Data Persistence

⚠️ **Data is lost on server restart** — this is an in-memory store suitable for development and testing only. For production, migrate to a persistent database (PostgreSQL, MongoDB, etc.).

### Email Delivery

Email functions (Stripe notifications, weekly reports) currently log to console. Implement nodemailer or SendGrid integration for production.

### Stripe Webhook

The `/functions/stripeWebhook` endpoint expects raw JSON body (not parsed). This is handled separately in `server.js` with `express.raw()`.

### Admin Role

Create the first user as admin by directly updating the database:

```bash
# In Node REPL after server starts:
// const { db } = require('./db/index.js');
// const users = db.list('User');
// db.update('User', users[0].id, { role: 'admin' });
```

---

## Updating the Frontend `.env`

Ensure the frontend points to this backend:

```env
BACKEND_URL=http://localhost:3001
```

---

## Support

For bugs or issues with the backend implementation, refer to the route files in `routes/functions/` and the original Deno source code in `base44/functions/` for logic comparison.
