import { StaticAuthProvider, AuthProvider } from '@twurple/auth';
import { ApiClient, HelixUser, HelixModeratedChannel } from '@twurple/api';
import { toMap } from '@/commons/helper';

export const AUTH_VERSION = 13;

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
    "moderator:read:moderators",
    "moderator:read:vips",
    "moderator:read:chatters",
    "moderator:read:followers",
    "moderator:read:shield_mode",
    "moderator:read:shoutouts",
    "moderation:read",
    "user:bot",
    "user:read:moderated_channels",
    "user:read:subscriptions",
    "user:read:chat",
    "user:write:chat"
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
        return !!DEFAULT_LOGIN_CONTEXT.accessToken;
    },
    getAuthProvider: () => {
        return new StaticAuthProvider(DEFAULT_LOGIN_CONTEXT.clientId, DEFAULT_LOGIN_CONTEXT.accessToken || '');
    },
    getApiClient: () => {
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
