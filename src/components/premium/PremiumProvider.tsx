import React, { useContext, useEffect, useState } from 'react';
import { PremiumContext, LoginContextContext } from '@/ApplicationContext';
import { Premium, DEFAULT_PREMIUM } from '@/commons/premium';
import * as premiumApi from '@/api/premium';

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loginContext = useContext(LoginContextContext);
  const [premium, setPremium] = useState<Premium>({
    ...DEFAULT_PREMIUM,
    checkPremiumStatus,
    getPremiumDetails,
    redeemCode,
    processPayment
  });

  // Check premium status on mount and when login context changes
  useEffect(() => {
    if (loginContext.isLoggedIn()) {
      checkPremiumStatus();
    }
  }, [loginContext]);


  async function checkPremiumStatus(): Promise<boolean> {
    try {
      const token = localStorage.getItem('hehe-token_state') || '';
      const result = await premiumApi.fetchPremiumStatus(token);
      setPremium(prev => ({ ...prev, isPremium: result.premium }));
      return result.premium;
    } catch (error) {
      console.error('Error checking premium status:', error);
      setPremium(prev => ({ ...prev, isPremium: false }));
      return false;
    }
  }

  async function getPremiumDetails(): Promise<any> {
    try {
      const token = localStorage.getItem('hehe-token_state') || '';
      const details = await premiumApi.fetchPremiumDetails(token);
      setPremium(prev => ({
        ...prev,
        isPremium: details.isActive,
        expiresAt: details.expires_at,
        subscriptionType: details.subscription_type,
        daysRemaining: details.daysRemaining,
        status: details.status
      }));
      return details;
    } catch (error) {
      console.error('Error fetching premium details:', error);
      return {
        isPremium: false,
        expiresAt: null,
        subscriptionType: null,
        daysRemaining: null,
        status: null
      };
    }
  }

  async function redeemCode(code: string): Promise<{ success: boolean; message: string }> {
    try {
      const token = localStorage.getItem('hehe-token_state') || '';
      const result = await premiumApi.redeemCode(token, code);
      if (result.success) {
        // Refresh premium status
        await getPremiumDetails();
      }
      return result;
    } catch (error) {
      console.error('Error redeeming code:', error);
      return { success: false, message: 'An error occurred while redeeming the code' };
    }
  }

  async function processPayment(paymentData: any): Promise<{ success: boolean; message: string }> {
    const token = localStorage.getItem('hehe-token_state') || '';
    if (!loginContext.isLoggedIn() || !loginContext.accessToken) {
      return { success: false, message: 'You must be logged in to process a payment' };
    }

    try {
      const result = await premiumApi.processPayPalPayment(token, paymentData);
      if (result.success) {
        // Refresh premium status
        await getPremiumDetails();
      }
      return result;
    } catch (error) {
      console.error('Error processing payment:', error);
      return { success: false, message: 'An error occurred while processing the payment' };
    }
  }

  return (
    <PremiumContext.Provider value={premium}>
      {children}
    </PremiumContext.Provider>
  );
};
