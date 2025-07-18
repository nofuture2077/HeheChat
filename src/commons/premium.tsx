import { createContext } from 'react';

export interface PremiumData {
  isPremium: boolean;
  expiresAt: string | null;
  subscriptionType: string | null;
  daysRemaining: number | null;
  status: string | null;
  loading?: boolean;
}

export interface Premium extends PremiumData {
  checkPremiumStatus: () => Promise<boolean>;
  getPremiumDetails: () => Promise<PremiumData>;
  redeemCode: (code: string) => Promise<{ success: boolean; message: string }>;
  processPayment: (paymentData: any) => Promise<{ success: boolean; message: string }>;
}

export const DEFAULT_PREMIUM: Premium = {
  isPremium: false,
  expiresAt: null,
  subscriptionType: null,
  daysRemaining: null,
  status: null,
  loading: false,
  checkPremiumStatus: async () => false,
  getPremiumDetails: async () => ({
    isPremium: false,
    expiresAt: null,
    subscriptionType: null,
    daysRemaining: null,
    status: null,
    loading: false
  }),
  redeemCode: async () => ({ success: false, message: 'Not implemented' }),
  processPayment: async () => ({ success: false, message: 'Not implemented' })
};

export const PremiumContext = createContext<Premium>(DEFAULT_PREMIUM);
