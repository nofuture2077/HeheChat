import { StaticAuthProvider, AuthProvider } from '@twurple/auth';
import { ApiClient, HelixUser, HelixModeratedChannel } from '@twurple/api';
import { toMap } from '@/commons/helper';

export const AUTH_VERSION = 15;

export const LOGIN_SCOPES = [
    "bits:read",
    "channel:bot",
    "channel:manage:predictions",
    "channel:manage:raids",
    "channel:manage:redemptions",
    "channel:manage:ads",
    "channel:manage:moderators",
    "channel:manage:vips",
    "channel:manage:polls",
    "channel:manage:predictions",
    "channel:read:goals",
    "channel:read:hype_train",
    "channel:read:redemptions",
    "channel:read:subscriptions",
    "channel:read:ads",
    "channel:edit:commercial",
    "channel:manage:broadcast",
    "channel:moderate",
    "chat:edit",
    "chat:read",
    "clips:edit",
    "moderator:manage:announcements",
    "moderator:manage:blocked_terms",
    "moderator:manage:chat_messages",
    "moderator:manage:banned_users",
    "moderator:manage:unban_requests",
    "moderator:manage:chat_settings",
    "moderator:manage:warnings",
    "moderator:manage:shoutouts",
    "moderator:read:moderators",
    "moderator:read:vips",
    "moderator:read:chatters",
    "moderator:read:followers",
    "moderator:read:shield_mode",
    "moderation:read",
    "user:bot",
    "user:read:moderated_channels",
    "user:read:subscriptions",
    "user:read:chat",
    "user:write:chat",
    "user:read:emotes"
];

export interface LoginContextData {
    clientId: string;
    accessToken?: string;
    userid?: string;
    user?: HelixUser;
    moderatedChannels: HelixModeratedChannel[];
}

export interface LoginContext extends LoginContextData {
    isLoggedIn: () => boolean;
    getAuthProvider: () => AuthProvider;
    getApiClient: () => ApiClient;
    setAccessToken: (token: string | undefined) => void;
    setUser: (user: HelixUser) => void;
    setModeratedChannels: (channels: HelixModeratedChannel[]) => void;
}

export const DEFAULT_LOGIN_CONTEXT: LoginContext = {
    clientId: import.meta.env.VITE_CLIENT_ID,
    isLoggedIn: () => {
        // Allow bypassing login in development mode
        if (import.meta.env.DEV && import.meta.env.VITE_BYPASS_LOGIN === 'true') {
            return true;
        }
        return !!DEFAULT_LOGIN_CONTEXT.accessToken;
    },
    getAuthProvider: () => {
        // Use mock auth provider in development mode
        if (import.meta.env.DEV && import.meta.env.VITE_BYPASS_LOGIN === 'true') {
            return new StaticAuthProvider(DEFAULT_LOGIN_CONTEXT.clientId, 'mock_token');
        }
        return new StaticAuthProvider(DEFAULT_LOGIN_CONTEXT.clientId, DEFAULT_LOGIN_CONTEXT.accessToken || '');
    },
    getApiClient: () => {
        // Return mock API client in development mode
        if (import.meta.env.DEV && import.meta.env.VITE_BYPASS_LOGIN === 'true') {
            const mockClient = new ApiClient({ authProvider: DEFAULT_LOGIN_CONTEXT.getAuthProvider()});
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
        return new ApiClient({ authProvider: DEFAULT_LOGIN_CONTEXT.getAuthProvider()});
    },
    setAccessToken: () => {},
    setUser: (user: HelixUser) => {},
    moderatedChannels: [],
    setModeratedChannels: (channels: HelixModeratedChannel[]) => {}
};

export async function getUserId(context: LoginContext) {
    const api = context.getApiClient();

    return (await api.getTokenInfo()).userId;
}

export async function getUserdata(context: LoginContext, usernames: string[]) {
    const api = context.getApiClient();
    const users = (await api.users.getUsersByNames(usernames)).map(u => ({user: u}));

    return toMap(users, u => u.user.name);
}
