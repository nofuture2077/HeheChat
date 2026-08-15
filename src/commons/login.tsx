import { StaticAuthProvider, AuthProvider, AccessTokenWithUserId } from '@twurple/auth';
import { ApiClient, HelixUser, HelixModeratedChannel } from '@twurple/api';
import { toMap } from '@/commons/helper';

export const AUTH_VERSION = 16;

// Twurple's StaticAuthProvider always calls Twitch's /oauth2/validate endpoint on its
// first use to resolve the token's userId, even if we already know it. That call fails
// for users whose network blocks id.twitch.tv. Since we already have a trusted userId
// from our own backend's token exchange, this provider supplies it directly and skips
// that network round-trip entirely.
export function createTrustedAuthProvider(clientId: string, accessToken: string, userId: string): AuthProvider {
    const token: AccessTokenWithUserId = {
        accessToken,
        refreshToken: null,
        scope: [],
        expiresIn: null,
        obtainmentTimestamp: 0,
        userId,
    };
    return {
        clientId,
        getCurrentScopesForUser: () => [],
        getAccessTokenForUser: async () => token,
        getAccessTokenForIntent: async () => token,
        getAnyAccessToken: async () => token,
    };
}

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
    adminClientId: string;
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
    isAdmin?: () => boolean;
}

export const DEFAULT_LOGIN_CONTEXT: LoginContext = {
    clientId: import.meta.env.VITE_CLIENT_ID,
    adminClientId: import.meta.env.VITE_ADMIN_CLIENT_ID,
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

// ponytail: backend token expiry only surfaces as a 401 on any authed call, so callers must check for it explicitly
export function handleUnauthorized(response: Response) {
    if (response.status === 401) {
        localStorage.removeItem('hehe-token');
        localStorage.removeItem('hehe-token_state');
        localStorage.removeItem('hehe-userid');
        window.location.reload();
        return true;
    }
    return false;
}

export async function getUserId(context: LoginContext) {
    const api = context.getApiClient();

    return (await api.getTokenInfo()).userId;
}

export async function getUserdata(context: LoginContext, usernames: string[]) {
    try {
        const api = context.getApiClient();
        const usersResponse = await api.users.getUsersByNames(usernames);
        
        // Ensure usersResponse is an array
        if (!Array.isArray(usersResponse)) {
            console.error('Expected users response to be an array but got:', typeof usersResponse);
            return new Map();
        }
        
        const users = usersResponse.map(u => ({user: u}));
        
        // Ensure users is an array before using toMap
        if (Array.isArray(users) && users.length > 0) {
            return toMap(users, u => u.user.name);
        } else {
            console.warn('No users found or empty array returned for usernames:', usernames);
            return new Map();
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        return new Map();
    }
}
