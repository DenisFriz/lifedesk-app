# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start Commands

- **Start development server** (auto-reload): `npm run dev`
- **Start production server**: `npm start`
- **Install dependencies**: `npm install`

The server runs on port 3001 by default (configurable via `PORT` env var).

## Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in required environment variables (see README.md for complete list)
3. Key vars: `JWT_SECRET` (min 32 chars), `STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `PLAID_CLIENT_ID`/`PLAID_SECRET`

## Architecture Overview

### Database Layer (`db/index.js`)

Simple **in-memory** database (no persistence). API:

- `db.list(entity)` - Get all records
- `db.filter(entity, conditions)` - Query by field values
- `db.read(entity, id)` - Get single record by ID
- `db.create(entity, data)` - Create and auto-assign `id`, `created_at`, `updated_at`
- `db.update(entity, id, data)` - Merge data, updates `updated_at`
- `db.delete(entity, id)` - Delete record
- `db.bulkCreate(entity, records)` - Batch create

Data is lost on server restart—this is development/test only.

### Authentication & RLS

**JWT-based auth** (30-day expiry):

- `middleware/auth.js`: Validates Bearer token, loads user into `req.user`
- All requests outside `/auth/register`, `/auth/login`, `/functions/getExchangeRates`, `/functions/debugServiceRole`, `/functions/stripeWebhook`, `/functions/weeklyRevenueReport` require valid JWT
- **Row-Level Security (RLS)**: Non-admin users can only access records where `created_by === req.user.id`

Middleware checklist:

- `requireAuth`: Attach JWT user to `req.user`
- `requireAdmin`: Check `req.user.role === 'admin'` (manually set in database)

### Route Structure

```
server.js                           # Express app setup, static routes
routes/
  auth.js                          # POST /auth/register, /login, /me
  entities.js                      # Generic CRUD: GET/POST/PUT/DELETE /entities/:entity
  functions/                       # Business logic (22 specialized endpoints)
    aiHealthChat.js               # Pro+ only, uses Anthropic Claude API
    createCheckoutSession.js       # Stripe checkout
    createBillingPortalSession.js  # Stripe customer portal
    stripeWebhook.js              # Webhook handler (raw JSON body)
    plaid.js                      # Bank integration
    summarizeMedicalDocument.js    # AI summarization (pro+)
    deleteAccount.js              # Account deletion
    ... (see routes/functions for all 22)
```

### Entity System

All 30 entities live in `schemas/` and follow a pattern:

```js
// schemas/Task.js example
export function defaults() {
  return { is_deleted: false, field1: null, ... };
}
```

Entity types: Task, Goal, Problem, Event, Business, Project, Client, Hobby, LearningItem, Contact, Income, Expense, RecurringIncome, RecurringExpense, OfflineAccount, BankBalanceSnapshot, BodyMeasurement, Workout, ProgressPhoto, MedicalDocument, TangibleAsset, Subscription, MarketingStrategy, MarketingCampaign, Idea, ContentIdea, TimeEntry, Note, WorkoutPlan, CommunityComment.

Generic CRUD routes in `routes/entities.js` handle all entity types with RLS enforcement.

## External Integrations

### Stripe

- **Endpoints**: `POST /functions/createCheckoutSession`, `POST /functions/createBillingPortalSession`, `POST /functions/stripeWebhook`
- **Webhook note**: `/functions/stripeWebhook` expects raw JSON body (handled separately in server.js with `express.raw()`)
- **Env vars**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PLUS_PRICE_ID`, `STRIPE_PRO_PRICE_ID`

### Anthropic (Claude AI)

- **Endpoints**: `POST /functions/aiHealthChat`, `POST /functions/summarizeMedicalDocument`
- **Auth**: Pro/Enterprise subscription tier only
- **Env var**: `ANTHROPIC_API_KEY`
- **Note**: Full context passed to Claude API for chat and document analysis

### Plaid

- **Endpoint**: `POST /functions/plaid`
- **Env vars**: `PLAID_CLIENT_ID`, `PLAID_SECRET`

## Key Implementation Patterns

### Handling RLS

All entity CRUD enforces `created_by` ownership:

```js
// In routes/entities.js, read operations filter by:
const userRecords = records.filter(
  (r) => r.created_by === req.user.id || req.user.role === 'admin',
);
// Write operations (create, update, delete) set/check created_by
```

### File Uploads

- Endpoint: `POST /upload` (requires auth)
- Files stored in `uploads/` directory (static served at `/uploads/`)
- Multer config: disk storage with timestamp-prefixed filenames
- Returns: `{ file_url: "http://localhost:3001/uploads/..." }`

### Admin-Only Functions

Endpoints decorated with `requireAuth, requireAdmin`:

- `/functions/backfillSubscriptions`
- `/functions/backupNow`
- `/functions/cleanupSubscriptions`
- `/functions/analyzeSubscriptionDuplicates`
- `/functions/adminSetUserTier`
- `/functions/adminClearDeletedFields`
- `/functions/testDeleteAccountScenarios`

To create first admin: manually update User record in database (set `role: 'admin'`).

## Testing

**No test framework configured.** For manual testing:

- Use curl (see README.md for examples)
- Or use Postman/Insomnia
- Full API documented in README.md endpoints section

## Important Notes

- **No persistence**: Data lost on restart. Suitable for dev/test only. For production, migrate to PostgreSQL/MongoDB.
- **No email**: Email functions (Stripe notifications, reports) log to console only. Integrate nodemailer/SendGrid for production.
- **ES6 modules**: All code uses `import/export` syntax (configured in package.json with `"type": "module"`).
- **CORS**: Configured for `FRONTEND_URL` env var (default: `http://localhost:3000`).
- **JWT expiry**: 30 days. Validate when modifying auth flows.
- **Subscription tiers**: "free", "plus", "pro", "enterprise" — used by feature gates in functions.

## Common Tasks

### Adding a new entity

1. Create `schemas/NewEntity.js` with `defaults()` export
2. Entity will work with existing generic `/entities/:entity` CRUD routes automatically
3. Add schema to relevant lists if feature-gated

### Adding a new business function

1. Create `routes/functions/myFunction.js` exporting default handler
2. Import in `server.js`
3. Register route (e.g., `app.post('/functions/myFunction', requireAuth, myFunction);`)
4. Add to endpoint list in README.md

### Debugging subscription issues

- Admin: GET `/functions/analyzeSubscriptionDuplicates`
- User: GET `/functions/debugSubscriptionStatus`
- By email: POST `/functions/debugSubscriptionByEmail` (requires admin)

## File Locations Reference

- `.env` - Environment variables (copy from `.env.example`)
- `server.js` - Express app, route registration, middleware setup
- `db/index.js` - In-memory database implementation
- `middleware/auth.js` - JWT verification and RLS
- `middleware/adminAuth.js` - Admin role check
- `routes/auth.js` - Register, login, profile endpoints
- `routes/entities.js` - Generic CRUD for all 30 entities
- `routes/functions/*` - 22 specialized business logic endpoints
- `schemas/*` - 30 entity schema defaults
- `uploads/` - Uploaded files served statically
- `QUICKSTART.md` - Quick setup guide
- `README.md` - Full documentation
