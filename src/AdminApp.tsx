import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';
import { Center, Loader, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { StaticAuthProvider } from '@twurple/auth';
import { ApiClient, HelixModeratedChannel, HelixUser } from '@twurple/api';
import { AdminRouter } from './AdminRouter';
import {
  ConfigContext,
  LoginContextContext,
  ChatEmotesContext,
  ProfileContext,
  PremiumContext,
} from './ApplicationContext';
import { DEFAULT_PREMIUM } from './commons/premium';
import { LoginContext, DEFAULT_LOGIN_CONTEXT } from './commons/login';
import { DEFAULT_CONFIG } from './commons/config';
import { DEFAULT_CHAT_EMOTES } from './commons/emotes';
import { DEFAULT_PROFILE } from './commons/profile';
import { theme } from './theme';

export const ADMIN_APP_NAME = 'HeheChat Admin';

export default function AdminApp() {
  const [loginContext, setLoginContext] = useState<LoginContext>(DEFAULT_LOGIN_CONTEXT);

  const setAccessToken = async (accessToken: string | undefined) => {
    setLoginContext((prev) => {
      const newContext = { ...prev, accessToken };
      return newContext;
    });
  };

  const setUser = async (user: HelixUser) => {
    setLoginContext((prev) => {
      const newContext = { ...prev, user };
      return newContext;
    });
  };

  const setModeratedChannels = async (moderatedChannels: HelixModeratedChannel[]) => {
    setLoginContext((prev) => {
      const newContext = { ...prev, moderatedChannels };
      return newContext;
    });
  };

  const isLoggedIn = () => {
    // Allow bypassing login in development mode
    if (import.meta.env.DEV && import.meta.env.VITE_BYPASS_LOGIN === 'true') {
      return true;
    }
    return !!loginContext.accessToken;
  };

  const getAuthProvider = () => {
    // Use mock auth provider in development mode
    if (import.meta.env.DEV && import.meta.env.VITE_BYPASS_LOGIN === 'true') {
      return new StaticAuthProvider(loginContext.adminClientId, 'mock_token');
    }
    return new StaticAuthProvider(loginContext.adminClientId, loginContext.accessToken || '');
  };

  const getApiClient = () => {
    // Return mock API client in development mode
    if (import.meta.env.DEV && import.meta.env.VITE_BYPASS_LOGIN === 'true') {
      const mockClient = new ApiClient({ authProvider: getAuthProvider() });
      // Override methods that might be called during development
      // @ts-ignore - We're intentionally creating a mock
      mockClient.users = {
        getUsersByNames: async () => [
          {
            name: 'dev_user',
            displayName: 'Development User',
            id: '123456789',
          },
        ],
      };
      return mockClient;
    }
    return new ApiClient({ authProvider: getAuthProvider() });
  };

  // undefined = not checked yet
  const [adminStatus, setAdminStatus] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    if (!loginContext.accessToken) {
      setAdminStatus(undefined);
      return;
    }
    const token = localStorage.getItem('hehe-token_state') || '';
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/admin/status?token=${encodeURIComponent(token)}`)
      .then((res) => (res.ok ? res.json() : undefined))
      .then((data) => setAdminStatus(!!data?.data?.isAdmin))
      .catch(() => setAdminStatus(false));
  }, [loginContext.accessToken]);

  // Server-side check via /api/admin/status; the backend enforces admin on every admin endpoint anyway
  const isAdmin = () => {
    if (import.meta.env.DEV && import.meta.env.VITE_BYPASS_LOGIN === 'true') {
      return true;
    }
    return isLoggedIn() && adminStatus === true;
  };

  const isCheckingAdmin =
    !(import.meta.env.DEV && import.meta.env.VITE_BYPASS_LOGIN === 'true') &&
    isLoggedIn() &&
    adminStatus === undefined;

  const appLogin = {
    ...loginContext,
    setAccessToken,
    isLoggedIn,
    getAuthProvider,
    getApiClient,
    setUser,
    setModeratedChannels,
    isAdmin,
  };

  return (
    <MantineProvider defaultColorScheme="auto" theme={theme}>
      <Notifications position="top-right" limit={5} />
      <ConfigContext.Provider value={DEFAULT_CONFIG}>
        <ProfileContext.Provider value={DEFAULT_PROFILE}>
          <LoginContextContext.Provider value={appLogin}>
            <ChatEmotesContext.Provider value={DEFAULT_CHAT_EMOTES}>
              <PremiumContext.Provider value={DEFAULT_PREMIUM}>
                {isCheckingAdmin ? (
                  <Center h="100vh">
                    <Loader />
                  </Center>
                ) : (
                  <AdminRouter />
                )}
              </PremiumContext.Provider>
            </ChatEmotesContext.Provider>
          </LoginContextContext.Provider>
        </ProfileContext.Provider>
      </ConfigContext.Provider>
    </MantineProvider>
  );
}
