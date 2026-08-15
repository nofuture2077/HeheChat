import { handleUnauthorized } from '@/commons/login';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export const fetchPremiumStatus = async (token: string) => {
  // Add cache-busting timestamp to prevent service worker caching
  const timestamp = new Date().getTime();
  const response = await fetch(`${API_BASE_URL}/premium/status?token=${encodeURIComponent(token)}&_=${timestamp}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  if (handleUnauthorized(response)) return null;
  return response.json();
};

export const fetchPremiumDetails = async (token: string) => {
  // Add cache-busting timestamp to prevent service worker caching
  const timestamp = new Date().getTime();
  const response = await fetch(`${API_BASE_URL}/premium/details?token=${encodeURIComponent(token)}&_=${timestamp}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  return response.json();
};

export const fetchPremiumHistory = async (token: string) => {
  // Add cache-busting timestamp to prevent service worker caching
  const timestamp = new Date().getTime();
  const response = await fetch(`${API_BASE_URL}/premium/history?token=${encodeURIComponent(token)}&_=${timestamp}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  return response.json();
};

export const getPremiumUntil = async (token: string) => {
  // Add cache-busting timestamp to prevent service worker caching
  const timestamp = new Date().getTime();
  const response = await fetch(`${API_BASE_URL}/premium/until?token=${encodeURIComponent(token)}&_=${timestamp}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  const data = await response.json();
  return data.expiresAt;
};

export const redeemCode = async (token: string, code: string) => {
  // Add cache-busting timestamp to prevent service worker caching
  const timestamp = new Date().getTime();
  const response = await fetch(`${API_BASE_URL}/premium/redeem?token=${encodeURIComponent(token)}&code=${encodeURIComponent(code)}&_=${timestamp}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
  return response.json();
};

export const processPayPalPayment = async (token: string, paymentData: any) => {
  // Add cache-busting timestamp to prevent service worker caching
  const timestamp = new Date().getTime();
  const response = await fetch(`${API_BASE_URL}/premium/paypal?token=${encodeURIComponent(token)}&_=${timestamp}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    body: JSON.stringify(paymentData)
  });
  return response.json();
};
