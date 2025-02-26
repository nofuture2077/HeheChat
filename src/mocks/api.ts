import { ApiClient, HelixUser } from '@twurple/api';
import { mockUser, mockTokenInfo, generateProfilePictureUrl } from './user';

type MockHelixUserApi = {
    getUsersByNames: (usernames: string[]) => Promise<HelixUser[]>;
    getUsersByIds: () => Promise<HelixUser[]>;
    getUserById: () => Promise<HelixUser | null>;
    getUserByIdBatched: () => Promise<HelixUser | null>;
    getUserByName: () => Promise<HelixUser | null>;
    getChannelEditors: () => Promise<HelixUser[]>;
    createUserFollow: () => Promise<void>;
    deleteUserFollow: () => Promise<void>;
    getFollowFromUserToChannel: () => Promise<any | null>;
    getFollowedChannels: () => Promise<{ data: any[]; cursor: string }>;
    getFollowedChannelsPaginated: () => { data: any[]; cursor: string };
    getChannelFollowers: () => Promise<{ data: any[]; cursor: string }>;
    getChannelFollowersPaginated: () => { data: any[]; cursor: string };
    getMyFollows: () => Promise<{ data: any[]; cursor: string }>;
};

export function createMockApiClient(client: ApiClient, clientId: string): ApiClient {
    const mockUsers: MockHelixUserApi = {
        getUsersByNames: async (usernames: string[]) => usernames.map(username => ({
            ...mockUser,
            name: username,
            displayName: username,
            profilePictureUrl: generateProfilePictureUrl(username, username)
        } as unknown as HelixUser)),
        getUsersByIds: async () => [],
        getUserById: async () => null,
        getUserByIdBatched: async () => null,
        getUserByName: async () => null,
        getChannelEditors: async () => [],
        createUserFollow: async () => {},
        deleteUserFollow: async () => {},
        getFollowFromUserToChannel: async () => null,
        getFollowedChannels: async () => ({ data: [], cursor: '' }),
        getFollowedChannelsPaginated: () => ({ data: [], cursor: '' }),
        getChannelFollowers: async () => ({ data: [], cursor: '' }),
        getChannelFollowersPaginated: () => ({ data: [], cursor: '' }),
        getMyFollows: async () => ({ data: [], cursor: '' })
    };

    // Create a proxy to intercept API calls
    return new Proxy(client, {
        get(target: any, prop: string | symbol) {
            if (prop === 'getTokenInfo') {
                return async () => ({
                    ...mockTokenInfo,
                    clientId,
                    obtainmentTimestamp: Date.now(),
                    expiresIn: 3600 // 1 hour
                });
            }
            if (prop === 'users') {
                return mockUsers;
            }
            return target[prop];
        }
    });
}
