import { db } from '../db/db';
import type { ExchangeRate } from '../types';

export const SUPPORTED_CURRENCIES = [
  { code: 'EGP', symbol: 'EGP', nameEn: 'Egyptian Pound', nameAr: 'جنيه مصري' },
  { code: 'USD', symbol: '$', nameEn: 'US Dollar', nameAr: 'دولار أمريكي' },
  { code: 'EUR', symbol: '€', nameEn: 'Euro', nameAr: 'يورو' },
  { code: 'SAR', symbol: 'SAR', nameEn: 'Saudi Riyal', nameAr: 'ريال سعودي' },
  { code: 'AED', symbol: 'AED', nameEn: 'UAE Dirham', nameAr: 'درهم إماراتي' },
  { code: 'GBP', symbol: '£', nameEn: 'British Pound', nameAr: 'جنيه إسترليني' },
  { code: 'KWD', symbol: 'KWD', nameEn: 'Kuwaiti Dinar', nameAr: 'دينار كويتي' },
];

export function formatCurrency(
  amount: number,
  currencyCode: string = 'EGP',
  locale: string = 'en-US'
): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  try {
    const formattedNum = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);

    const curr = SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode);
    const symbol = curr ? curr.symbol : currencyCode;
    return `${formattedNum} ${symbol}`;
  } catch {
    return `${safeAmount.toFixed(2)} ${currencyCode}`;
  }
}

/**
 * Safe conversion between currencies using user's explicit stored exchange rates.
 * Returns null if no direct or inverse conversion exists, preventing silent guessing.
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ convertedAmount: number; rateUsed: number; rateDate?: string } | null> {
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amount, rateUsed: 1 };
  }

  // 1. Direct rate
  const directRate = await db.exchangeRates
    .where({ fromCurrency, toCurrency })
    .first();
  if (directRate && directRate.rate > 0) {
    return {
      convertedAmount: Math.round(amount * directRate.rate * 100) / 100,
      rateUsed: directRate.rate,
      rateDate: directRate.rateDate,
    };
  }

  // 2. Inverse rate
  const inverseRate = await db.exchangeRates
    .where({ fromCurrency: toCurrency, toCurrency: fromCurrency })
    .first();
  if (inverseRate && inverseRate.rate > 0) {
    const inverted = 1 / inverseRate.rate;
    return {
      convertedAmount: Math.round(amount * inverted * 100) / 100,
      rateUsed: inverted,
      rateDate: inverseRate.rateDate,
    };
  }

  return null;
}

export async function saveExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  rateDate: string = new Date().toISOString().split('T')[0]
): Promise<void> {
  const existing = await db.exchangeRates
    .where({ fromCurrency, toCurrency })
    .first();

  if (existing) {
    await db.exchangeRates.update(existing.id, {
      rate,
      rateDate,
      updatedAt: new Date().toISOString(),
    });
  } else {
    await db.exchangeRates.add({
      id: `rate-${fromCurrency.toLowerCase()}-${toCurrency.toLowerCase()}-${Date.now()}`,
      fromCurrency,
      toCurrency,
      rate,
      rateDate,
      updatedAt: new Date().toISOString(),
    });
  }
}
