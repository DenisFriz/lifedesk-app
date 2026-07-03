import type { Request, Response } from 'express';

let cachedRates: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const topCurrencies = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'HKD',
  'NZD',
  'SEK',
  'KRW',
  'SGD',
  'NOK',
  'MXN',
  'INR',
  'RUB',
  'ZAR',
  'TRY',
  'BRL',
  'TWD',
  'DKK',
  'PLN',
  'THB',
  'IDR',
  'HUF',
  'CZK',
  'ILS',
  'CLP',
  'PHP',
  'AED',
  'COP',
  'SAR',
  'MYR',
  'RON',
  'ARS',
  'VND',
  'BGN',
  'UAH',
  'EGP',
];

export async function getExchangeRates(req: Request, res: Response) {
  try {
    if (cachedRates && Date.now() - cacheTimestamp < CACHE_TTL) {
      return res.json(cachedRates);
    }

    const [fiatResponse, cryptoResponse] = await Promise.all([
      fetch('https://open.er-api.com/v6/latest/EUR'),
      fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,solana,ripple,usd-coin,cardano,avalanche-2,dogecoin&vs_currencies=eur',
      ).catch(() => null),
    ]);

    if (!fiatResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch exchange rates' });
    }

    const fiatData = (await fiatResponse.json()) as any;
    if (fiatData.result === 'error') {
      return res.status(500).json({ error: 'Exchange rate API error' });
    }

    const filteredRates: Record<string, number> = {};
    topCurrencies.forEach((currency) => {
      if (fiatData.rates[currency]) {
        filteredRates[currency] = fiatData.rates[currency];
      }
    });

    if (cryptoResponse?.ok) {
      const cryptoData = (await cryptoResponse.json()) as any;
      const cryptoMap: Record<string, string> = {
        bitcoin: 'BTC',
        ethereum: 'ETH',
        tether: 'USDT',
        binancecoin: 'BNB',
        solana: 'SOL',
        ripple: 'XRP',
        'usd-coin': 'USDC',
        cardano: 'ADA',
        'avalanche-2': 'AVAX',
        dogecoin: 'DOGE',
      };

      Object.entries(cryptoData).forEach(([key, value]) => {
        const symbol = cryptoMap[key];
        if (symbol && (value as any).eur) {
          filteredRates[symbol] = 1 / (value as any).eur;
        }
      });
    }

    cachedRates = {
      base: 'EUR',
      date: new Date(fiatData.time_last_update_unix * 1000)
        .toISOString()
        .split('T')[0],
      rates: filteredRates,
    };
    cacheTimestamp = Date.now();

    res.json(cachedRates);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: message });
  }
}
