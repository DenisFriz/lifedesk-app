# Backend Quick Start Guide

## 1. Install & Setup (2 minutes)

```bash
cd backend
npm install
cp .env.example .env
```

## 2. Start the Server

```bash
npm run dev
```

You should see:

```
✅ Backend running on port 3001
📍 API Base URL: http://localhost:3001
🔌 CORS enabled for: http://localhost:3000
```

## 3. Test Basic Functionality

### Create a test user

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

Response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid...",
    "email": "test@example.com",
    "full_name": "Test User",
    "subscription_tier": "free",
    ...
  }
}
```

### Save the token

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Create a task

```bash
curl -X POST http://localhost:3001/entities/Task \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Task",
    "category": "health_body"
  }'
```

### Get your tasks

```bash
curl http://localhost:3001/entities/Task \
  -H "Authorization: Bearer $TOKEN"
```

### Get exchange rates (no auth needed)

```bash
curl http://localhost:3001/functions/getExchangeRates
```

## 4. Optional: Add Stripe Integration

To enable Stripe checkout:

1. Get your Stripe API keys from https://dashboard.stripe.com
2. Create two price IDs (one for Plus, one for Pro plan)
3. Update `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_PLUS_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
```

4. Restart the server

Now checkout endpoints will work:

```bash
curl -X POST http://localhost:3001/functions/createCheckoutSession \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_name": "pro",
    "success_url": "http://localhost:3000/Profile?checkout=success",
    "cancel_url": "http://localhost:3000/Profile?checkout=cancel"
  }'
```

## 5. Optional: Add AI Health Chat

To enable the AI health chat (requires Pro subscription):

1. Get API key from https://console.anthropic.com
2. Update `.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

3. Restart the server

Now test the AI endpoint:

```bash
# First, set user to pro tier manually
# OR upgrade via Stripe checkout

curl -X POST http://localhost:3001/functions/aiHealthChat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is my monthly budget based on my recurring expenses?",
    "file_urls": []
  }'
```

## 6. Connect Frontend

Update the frontend `.env` file:

```env
BACKEND_URL=http://localhost:3001
```

Then restart the frontend dev server:

```bash
cd ../
npm run dev
```

Now the React app will communicate with this backend instead of the Base44 BaaS.

## 7. Common Issues

### "Unauthorized" when creating tasks

- Make sure the `Authorization: Bearer` header is included
- Token must not be expired (30 days from creation)
- User must exist in the database

### "CORS error"

- Check `.env` `FRONTEND_URL` matches your frontend origin
- Restart the server after changing `.env`

### Stripe functions fail

- Missing `STRIPE_SECRET_KEY` or price IDs in `.env`
- Webhook verification fails if `STRIPE_WEBHOOK_SECRET` is wrong

### AI functions return errors

- `ANTHROPIC_API_KEY` is missing or invalid
- User subscription tier is not "pro" or "enterprise"

## 8. What's NOT Working Yet

These features require actual external API credentials:

- ✅ Auth & basic CRUD
- ✅ In-memory data storage
- ✅ Exchange rates (uses free API)
- ⚠️ Stripe (needs real account & API keys)
- ⚠️ Plaid (needs real account & API keys)
- ⚠️ AI Health Chat (needs real Anthropic API key)
- ⚠️ Email (logs to console only)

## 9. Next Steps

- [ ] Configure your Stripe account
- [ ] Configure Anthropic API key
- [ ] Test checkout flow end-to-end
- [ ] Test AI chat with pro subscription
- [ ] Configure Plaid for bank connections (optional)

---

**Need help?** Check the detailed [README.md](./README.md) or review route files in `routes/functions/` for implementation details.
