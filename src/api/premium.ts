const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export const fetchPremiumStatus = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/premium/status?token=${encodeURIComponent(token)}`);
  return response.json();
};

export const fetchPremiumDetails = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/premium/details?token=${encodeURIComponent(token)}`);
  return response.json();
};

export const fetchPremiumHistory = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/premium/history?token=${encodeURIComponent(token)}`);
  return response.json();
};

export const getPremiumUntil = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/premium/until?token=${encodeURIComponent(token)}`);
  const data = await response.json();
  return data.expiresAt;
};

export const redeemCode = async (token: string, code: string) => {
  const response = await fetch(`${API_BASE_URL}/premium/redeem?token=${encodeURIComponent(token)}&code=${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

export const processPayPalPayment = async (token: string, paymentData: any) => {
  const response = await fetch(`${API_BASE_URL}/premium/paypal?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentData)
  });
  return response.json();
};
