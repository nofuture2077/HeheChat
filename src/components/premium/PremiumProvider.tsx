import React, { useContext, useEffect, useState } from 'react';
import { PremiumContext, LoginContextContext } from '@/ApplicationContext';
import { Premium, DEFAULT_PREMIUM } from '@/commons/premium';
import * as premiumApi from '@/api/premium';

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loginContext = useContext(LoginContextContext);
  const [loading, setLoading] = useState(true);
  const [premium, setPremium] = useState<Premium>({
    ...DEFAULT_PREMIUM,
    loading: true,
    checkPremiumStatus,
    getPremiumDetails,
    redeemCode,
    processPayment
  });
  
  // Centralized premium data fetching
  // This will fetch both status and details in one place
  const fetchPremiumData = async () => {
    if (!loginContext.isLoggedIn()) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('hehe-token_state') || '';
      
      // First check status
      const statusResult = await premiumApi.fetchPremiumStatus(token);
      const isPremium = statusResult.premium;
      
      // If premium, also fetch details
      if (isPremium) {
        const details = await premiumApi.fetchPremiumDetails(token);
        setPremium(prev => ({
          ...prev,
          isPremium: details.isActive,
          expiresAt: details.expires_at,
          subscriptionType: details.subscription_type,
          daysRemaining: details.daysRemaining,
          status: details.status,
          loading: false
        }));
      } else {
        setPremium(prev => ({ 
          ...prev, 
          isPremium: false,
          loading: false
        }));
      }
    } catch (error) {
      console.error('Error fetching premium data:', error);
      setPremium(prev => ({ 
        ...prev, 
        isPremium: false,
        loading: false
      }));
    } finally {
      setLoading(false);
    }
  };

  // Check premium status on mount and when login state changes
  useEffect(() => {
    fetchPremiumData();
  }, [loginContext.isLoggedIn]);

  // These functions now update the centralized state
  async function checkPremiumStatus(): Promise<boolean> {
    await fetchPremiumData();
    return premium.isPremium;
  }

  async function getPremiumDetails(): Promise<any> {
    if (loading) {
      // If we're already loading data, wait for it to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!loading) {
            clearInterval(checkInterval);
            resolve({
              isPremium: premium.isPremium,
              expiresAt: premium.expiresAt,
              subscriptionType: premium.subscriptionType,
              daysRemaining: premium.daysRemaining,
              status: premium.status
            });
          }
        }, 100);
      });
    }
    
    // If not loading, fetch fresh data
    await fetchPremiumData();
    return {
      isPremium: premium.isPremium,
      expiresAt: premium.expiresAt,
      subscriptionType: premium.subscriptionType,
      daysRemaining: premium.daysRemaining,
      status: premium.status
    };
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
