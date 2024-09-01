import PubSub from 'pubsub-js';

export type ModActionType = 'delete' | 'timeout' | 'ban';

export const deleteMessage = (channelId: string, messageId: string) => {
    PubSub.publish('WSSEND', {type: 'deleteMessage', channelId, messageId});
}

export const timeoutUser = (channelId: string, targetUserId: string, duration: number, reason: string) => {
    PubSub.publish('WSSEND', {type: 'timeoutUser', channelId, targetUserId, duration, reason});
}

export const banUser = (channelId: string, targetUserId: string, reason: string) => {
    PubSub.publish('WSSEND', {type: 'banUser', channelId, targetUserId, reason});
}

export const shoutoutUser =  (channelId: string, targetUserId: string) => {
    PubSub.publish('WSSEND', {type: 'shoutoutUser', channelId, targetUserId});
};

export const raidUser =  (channelIdFrom: string, channelIdTo: string) => {
    PubSub.publish('WSSEND', {type: 'raidUser', channelIdFrom, channelIdTo});
};

export interface ModActions {
    deleteMessage: (channelId: string, messageId: string) => void;
    timeoutUser: (channelId: string, userId: string, duration: number, reason: string) => void;
    banUser: (channelId: string, userId: string, reason: string) => void;
    shoutoutUser: (channelId: string, userId: string) => void;
    raidUser: (fromChannelId: string, toChannelId: string) => void;
}