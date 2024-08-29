import { StaticAuthProvider, AuthProvider } from '@twurple/auth';
import { ApiClient, HelixUser, HelixModeratedChannel } from '@twurple/api';
import { toMap } from '@/commons/helper';

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
