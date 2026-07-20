import { Router } from 'express';

import { requireAuth } from '@middleware/auth.js';
import { requireAdmin } from '@middleware/adminAuth.js';

import { aiHealthChat } from '@controllers/aiHealthChat.js';
import { adminSetUserTier } from '@controllers/adminSetUserTier.js';
import { adminClearDeletedFields } from '@controllers/adminClearDeletedFields.js';
import { analyzeSubscriptionDuplicates } from '@controllers/analyzeSubscriptionDuplicates.js';
import { backfillSubscriptions } from '@controllers/backfillSubscriptions.js';
import { cleanupSubscriptions } from '@controllers/cleanupSubscriptions.js';
import { createBillingPortalSession } from '@controllers/createBillingPortalSession.js';
import { createCheckoutSession } from '@controllers/createCheckoutSession.js';
import { deleteAccount } from '@controllers/deleteAccount.js';
import { downgradeToPlan } from '@controllers/downgradeToPlan.js';
import { stripeWebhook } from '@controllers/stripeWebhook.js';
import { plaid } from '@controllers/plaid.js';
import { weeklyRevenueReport } from '@controllers/weeklyRevenueReport.js';
import { debugSubscriptionStatus } from '@controllers/debugSubscriptionStatus.js';
import { debugSubscriptionByEmail } from '@controllers/debugSubscriptionByEmail.js';
import { getExchangeRates } from '@controllers/getExchangeRates.js';
import { validateStorageUpload } from '@controllers/validateStorageUpload.js';
import { syncSubscriptionFromStripe } from '@controllers/syncSubscriptionFromStripe.js';
import { summarizeMedicalDocument } from '@controllers/summarizeMedicalDocument.js';
import { debugServiceRole } from '@controllers/debugServiceRole.js';

const router = Router();

// --- No-auth ---
router.post('/stripeWebhook', stripeWebhook);

// --- requireAuth ---
router.get('/getExchangeRates', requireAuth, getExchangeRates);
/* router.get('/debugServiceRole', requireAuth, debugServiceRole);
router.post('/weeklyRevenueReport', requireAuth, weeklyRevenueReport); */
router.post('/aiHealthChat', requireAuth, aiHealthChat);
router.post('/createCheckoutSession', requireAuth, createCheckoutSession);
router.post(
  '/createBillingPortalSession',
  requireAuth,
  createBillingPortalSession,
);
router.post(
  '/syncSubscriptionFromStripe',
  requireAuth,
  syncSubscriptionFromStripe,
);
/* router.post('/validateStorageUpload', requireAuth, validateStorageUpload); */
/* router.post('/summarizeMedicalDocument', requireAuth, summarizeMedicalDocument); */
router.post('/deleteAccount', requireAuth, deleteAccount);
router.post('/downgradeToPlan', requireAuth, downgradeToPlan);
/* router.post('/debugSubscriptionByEmail', requireAuth, debugSubscriptionByEmail); */
/* router.get('/debugSubscriptionStatus', requireAuth, debugSubscriptionStatus); */
router.post('/plaid', requireAuth, plaid);

// --- requireAuth + requireAdmin ---
/* router.post(
  '/backfillSubscriptions',
  requireAuth,
  requireAdmin,
  backfillSubscriptions,
); */
/* router.post(
  '/cleanupSubscriptions',
  requireAuth,
  requireAdmin,
  cleanupSubscriptions,
); */
/* router.get(
  '/analyzeSubscriptionDuplicates',
  requireAuth,
  requireAdmin,
  analyzeSubscriptionDuplicates,
); */
/* router.post('/adminSetUserTier', requireAuth, requireAdmin, adminSetUserTier); */
router.post(
  '/adminClearDeletedFields',
  requireAuth,
  requireAdmin,
  adminClearDeletedFields,
);

export default router;
