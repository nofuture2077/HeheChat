import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useState, useEffect } from 'react';
import { AdminRouter } from './AdminRouter';
import { ConfigContext, LoginContextContext, ChatEmotesContext, ProfileContext, PremiumContext } from './ApplicationContext';
import { Premium, DEFAULT_PREMIUM } from './commons/premium';
import { LoginContext, DEFAULT_LOGIN_CONTEXT } from './commons/login';
import { StaticAuthProvider } from '@twurple/auth';
import { ApiClient, HelixModeratedChannel, HelixUser } from '@twurple/api';
import { DEFAULT_CONFIG } from './commons/config';
import { DEFAULT_CHAT_EMOTES } from './commons/emotes';
import { DEFAULT_PROFILE } from './commons/profile';
import { theme } from './theme';

export const ADMIN_APP_NAME = "HeheChat Admin";

interface AdminAppProps {}

export default function AdminApp(props: AdminAppProps) {
    const [loginContext, setLoginContext] = useState<LoginContext>(DEFAULT_LOGIN_CONTEXT);

    const setAccessToken = async (accessToken: string | undefined) => {
        setLoginContext((loginContext) => {
            const newContext = { ...loginContext, accessToken };
            return newContext;
        });
    }

    const setUser = async (user: HelixUser) => {
        setLoginContext((loginContext) => {
            const newContext = { ...loginContext, user };
            return newContext;
        });
    }

    const setModeratedChannels = async (moderatedChannels: HelixModeratedChannel[]) => {
        setLoginContext((loginContext) => {
            const newContext = { ...loginContext, moderatedChannels };
            return newContext;
        });
    }

    const isLoggedIn = () => {
        // Allow bypassing login in development mode
        if (import.meta.env.DEV && import.meta.env.VITE_BYPASS_LOGIN === 'true') {
            return true;
        }
        return !!loginContext.accessToken;
    }

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
            const mockClient = new ApiClient({ authProvider: getAuthProvider()});
            // Override methods that might be called during development
            // @ts-ignore - We're intentionally creating a mock
            mockClient.users = {
                getUsersByNames: async () => [{
                    name: 'dev_user',
                    displayName: 'Development User',
                    id: '123456789'
                }]
            };
            return mockClient;
        }
        return new ApiClient({ authProvider: getAuthProvider()});
    };

    // Check if user is admin (implement your own admin check logic here)
    const isAdmin = () => {
        // For development, allow bypass
        if (import.meta.env.DEV && import.meta.env.VITE_BYPASS_LOGIN === 'true') {
            return true;
        }
        
        // In production, check if user is logged in and has admin privileges
        // You can modify this to check against a list of admin user IDs or roles
        if (!isLoggedIn() || !loginContext.user) {
            return false;
        }
        
        // Add your admin user check logic here
        // For example, check against a list of admin user IDs:
        // const adminUserIds = ['123456789', '987654321']; // Replace with actual admin user IDs
        // return adminUserIds.includes(loginContext.user.id);
        
        // For now, we'll allow any logged-in user to access admin (change this in production)
        return true;
    };

    const appLogin = {
        ...loginContext,
        setAccessToken,
        isLoggedIn,
        getAuthProvider,
        getApiClient,
        setUser,
        setModeratedChannels,
        isAdmin
    };

    return (
        <MantineProvider defaultColorScheme="auto" theme={theme}>
            <Notifications position="top-right" limit={5} />
            <ConfigContext.Provider value={DEFAULT_CONFIG}>
                <ProfileContext.Provider value={DEFAULT_PROFILE}>
                    <LoginContextContext.Provider value={appLogin}>
                        <ChatEmotesContext.Provider value={DEFAULT_CHAT_EMOTES}>
                            <PremiumContext.Provider value={DEFAULT_PREMIUM}>
                                <AdminRouter />
                            </PremiumContext.Provider>
                        </ChatEmotesContext.Provider>
                    </LoginContextContext.Provider>
                </ProfileContext.Provider>
            </ConfigContext.Provider>
        </MantineProvider>
    );
}
