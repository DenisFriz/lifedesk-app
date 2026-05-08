import type { Request, Response } from 'express';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { User, BankBalanceSnapshot } from '@/models/index.js';

const config = new Configuration({
  basePath: PlaidEnvironments.production,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(config);

type PlaidAction =
  | 'create_link_token'
  | 'exchange_public_token'
  | 'get_connections'
  | 'get_balances'
  | 'get_transactions'
  | 'snapshot_balances'
  | 'remove_connection';

type PlaidRequestBody = {
  action: PlaidAction;
  public_token?: string;
  institution_name?: string;
  days?: number;
  item_id?: string;
};

export async function plaid(
  req: Request<{}, {}, PlaidRequestBody>,
  res: Response,
) {
  try {
    const { action } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (action === 'create_link_token') {
      const response = await plaidClient.linkTokenCreate({
        user: { client_user_id: req.user.id },
        client_name: 'LifeDesk',
        products: ['transactions'] as any,
        country_codes: ['DE'] as any,
        language: 'en',
      });
      return res.json({ link_token: response.data.link_token });
    }

    if (action === 'exchange_public_token') {
      const { public_token, institution_name } = req.body;

      if (!public_token) {
        return res.status(404).json({ error: 'Public token not provided' });
      }

      const exchangeResponse = await plaidClient.itemPublicTokenExchange({
        public_token,
      });
      const { access_token, item_id } = exchangeResponse.data;

      const userDoc = await User.findOne({ id: req.user.id });
      if (!userDoc) return res.status(404).json({ error: 'User not found' });

      const existingConnections = userDoc.plaid_connections || [];
      userDoc.plaid_connections = [
        ...existingConnections,
        {
          item_id,
          access_token,
          institution_name: institution_name || 'Bank',
          connected_at: new Date().toISOString(),
        },
      ];
      await userDoc.save();

      return res.json({ success: true, item_id, institution_name });
    }

    if (action === 'get_connections') {
      const connections = (req.user.plaid_connections || []).map((c) => ({
        item_id: c.item_id,
        institution_name: c.institution_name,
        connected_at: c.connected_at,
      }));
      return res.json({ connections });
    }

    if (action === 'get_balances') {
      const connections = req.user.plaid_connections || [];
      const allAccounts: any[] = [];

      for (const conn of connections) {
        const response = await plaidClient.accountsBalanceGet({
          access_token: conn.access_token,
        });
        for (const account of response.data.accounts) {
          allAccounts.push({
            account_id: account.account_id,
            item_id: conn.item_id,
            institution_name: conn.institution_name,
            name: account.name,
            official_name: account.official_name,
            type: account.type,
            subtype: account.subtype,
            balance: account.balances.current,
            available: account.balances.available,
            currency: account.balances.iso_currency_code || 'USD',
          });
        }
      }

      return res.json({ accounts: allAccounts });
    }

    if (action === 'get_transactions') {
      const { days = 90 } = req.body;
      const connections = req.user.plaid_connections || [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = new Date().toISOString().split('T')[0];

      const allTransactions: any[] = [];

      for (const conn of connections) {
        const response = await plaidClient.transactionsGet({
          access_token: conn.access_token,
          start_date: startDateStr,
          end_date: endDateStr,
          options: { count: 500 },
        });

        const { transactions } = response.data;

        for (const tx of transactions) {
          const isIncome = tx.amount < 0;
          const amount = Math.abs(tx.amount);

          allTransactions.push({
            plaid_transaction_id: tx.transaction_id,
            title: tx.merchant_name || tx.name || 'Transaction',
            amount: isIncome ? amount : -amount,
            date: tx.date,
            category:
              (tx as any).personal_finance_category?.primary ||
              (tx.category?.[0] ?? null),
            subcategory:
              (tx as any).personal_finance_category?.detailed ||
              (tx.category?.[1] ?? null),
            institution_name: conn.institution_name,
            account_name: tx.account_id,
            pending: tx.pending,
          });
        }
      }

      return res.json({ transactions: allTransactions });
    }

    if (action === 'snapshot_balances') {
      const today = new Date().toISOString().split('T')[0];
      const connections = req.user.plaid_connections || [];

      if (connections.length === 0)
        return res.json({
          skipped: true,
          reason: 'no connections',
        });

      const existingSnapshot = await BankBalanceSnapshot.findOne({
        date: today,
        created_by: req.user.id,
      }).lean();
      if (existingSnapshot)
        return res.json({
          skipped: true,
          reason: 'already snapshotted today',
        });

      const snapshots: any[] = [];
      for (const conn of connections) {
        const response = await plaidClient.accountsBalanceGet({
          access_token: conn.access_token,
        });
        for (const account of response.data.accounts) {
          snapshots.push({
            date: today,
            account_id: account.account_id,
            account_name: account.name || account.official_name || 'Account',
            institution_name: conn.institution_name,
            balance: account.balances.current ?? 0,
            available: account.balances.available ?? null,
            currency: account.balances.iso_currency_code || 'USD',
            created_by: req.user.id,
          });
        }
      }

      await BankBalanceSnapshot.insertMany(snapshots);
      return res.json({ success: true, count: snapshots.length });
    }

    if (action === 'remove_connection') {
      const { item_id } = req.body;
      const userDoc = await User.findOne({ id: req.user.id });
      if (!userDoc) return res.status(404).json({ error: 'User not found' });

      const connections = userDoc.plaid_connections || [];
      const conn = connections.find((c) => c.item_id === item_id);

      if (conn) {
        try {
          await plaidClient.itemRemove({
            access_token: conn.access_token,
          });
        } catch (err: any) {
          console.warn('Plaid itemRemove failed:', err.message);
        }
        userDoc.plaid_connections = connections.filter(
          (c) => c.item_id !== item_id,
        );
        await userDoc.save();
      }

      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Unknown action' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
