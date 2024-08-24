import { ChatEmotes } from "@/commons/emotes";
import { LoginContext } from '@/commons/login'
import { ApiClient } from "@twurple/api";

export type ModActionType = 'delete' | 'timeout' | 'ban';

export const deleteMessage = (api: ApiClient, loginContext: LoginContext) => (channelId: string, messageId: string) => {
    api.asUser(loginContext.user?.id || '', async (ctx) => {
        ctx.moderation.deleteChatMessages({id: channelId}, messageId);
    });
}

export const timeoutUser = (api: ApiClient, loginContext: LoginContext) =>  (channelId: string, userId: string, duration: number, reason: string) => {
    api.asUser(loginContext.user?.id || '', async (ctx) => {
        const data = {duration, reason, user: {id: userId}};
        ctx.moderation.banUser({id: channelId}, data);
    });
}

export const banUser = (api: ApiClient, loginContext: LoginContext) =>  (channelId: string, userId: string, reason: string) => {
    api.asUser(loginContext.user?.id || '', async (ctx) => {
        const data = {reason, user: {id: userId}};
        ctx.moderation.banUser({id: channelId}, data);
    });
}

export const shoutoutUser = (api: ApiClient, loginContext: LoginContext) =>  (channelId: string, userId: string) => {
    api.asUser(loginContext.user?.id || '', async (ctx) => {
        ctx.chat.shoutoutUser(channelId, userId);
    });
};

export const raidUser = (api: ApiClient, loginContext: LoginContext, emotes: ChatEmotes) =>  (channelFromName: string, channelToName: string) => {
    return api.asUser(loginContext.user?.id || '', async (ctx) => {
        ctx.raids.startRaid(emotes.getChannelId(channelFromName), emotes.getChannelId(channelToName));
    });
};

export interface ModActions {
    deleteMessage: (channelId: string, messageId: string) => void;
    timeoutUser: (channelId: string, userId: string, duration: number, reason: string) => void;
    banUser: (channelId: string, userId: string, reason: string) => void;
    shoutoutUser: (channelId: string, userId: string) => void;
    raidUser: (fromChannelId: string, toChannelId: string) => Promise<void>;
}