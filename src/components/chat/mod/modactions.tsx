import PubSub from 'pubsub-js';
import { query, param } from '../../../commons/helper';

export type ModActionType =
  | 'delete'
  | 'timeout'
  | 'ban'
  | 'unban'
  | 'mod'
  | 'unmod'
  | 'vip'
  | 'unvip';

export const deleteMessage = (channelId: string, messageId: string) => {
  PubSub.publish('WSSEND', { type: 'deleteMessage', channelId, messageId });
};

export const timeoutUser = (
  channelId: string,
  targetUserId: string,
  duration: number,
  reason: string
) => {
  PubSub.publish('WSSEND', { type: 'timeoutUser', channelId, targetUserId, duration, reason });
};

export const banUser = (channelId: string, targetUserId: string, reason: string) => {
  PubSub.publish('WSSEND', { type: 'banUser', channelId, targetUserId, reason });
};

export const unbanUser = (channelId: string, targetUserId: string) => {
  PubSub.publish('WSSEND', { type: 'unbanUser', channelId, targetUserId });
};

export const modUser = (channelId: string, targetUserId: string) => {
  PubSub.publish('WSSEND', { type: 'addMod', channelId, targetUserId });
};

export const unmodUser = (channelId: string, targetUserId: string) => {
  PubSub.publish('WSSEND', { type: 'removeMod', channelId, targetUserId });
};

export const vipUser = (channelId: string, targetUserId: string) => {
  PubSub.publish('WSSEND', { type: 'addVip', channelId, targetUserId });
};

export const unvipUser = (channelId: string, targetUserId: string) => {
  PubSub.publish('WSSEND', { type: 'removeVip', channelId, targetUserId });
};

export const shoutoutUser = (channelId: string, targetUserId: string) => {
  PubSub.publish('WSSEND', { type: 'shoutoutUser', channelId, targetUserId });
};

export const raidUser = (channelIdFrom: string, channelIdTo: string) => {
  PubSub.publish('WSSEND', { type: 'raidUser', channelIdFrom, channelIdTo });
};

export const unraid = (channelIdFrom: string) => {
  PubSub.publish('WSSEND', { type: 'unraid', channelIdFrom });
};

// Native Twitch pinned chat messages, relayed by the backend. duration in seconds (30-1800), omitted = until stream end
export const pinMessage = (
  channel: string,
  channelId: string,
  messageId: string,
  duration?: number
) => {
  PubSub.publish('WSSEND', { type: 'pinMessage', channel, channelId, messageId, duration });
};

export const updatePin = (
  channel: string,
  channelId: string,
  messageId: string,
  duration?: number
) => {
  PubSub.publish('WSSEND', { type: 'updatePin', channel, channelId, messageId, duration });
};

export const unpinMessage = (channel: string, channelId: string, messageId: string) => {
  PubSub.publish('WSSEND', { type: 'unpinMessage', channel, channelId, messageId });
};

// The answer arrives as 'WS-pin'
export const requestPin = (channel: string) => {
  PubSub.publish('WSSEND', { type: 'getPin', channel });
};

export const getUserId = async (username: string) => {
  const state = localStorage.getItem('hehe-token_state') || '';
  return fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/user/id?${query([
      param('state', state),
      param('username', username),
    ])}`
  ).then((res) => res.json());
};

export const getUserInfo = async (channel: string, username: string) => {
  const state = localStorage.getItem('hehe-token_state') || '';
  return fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/user?${query([
      param('state', state),
      param('channel', channel),
      param('username', username),
    ])}`
  ).then((res) => res.json());
};

export interface ModActions {
  deleteMessage: (channelId: string, messageId: string) => void;
  timeoutUser: (channelId: string, userId: string, duration: number, reason: string) => void;
  banUser: (channelId: string, userId: string, reason: string) => void;
  unbanUser: (channelId: string, userId: string) => void;
  shoutoutUser: (channelId: string, userId: string) => void;
  raidUser: (fromChannelId: string, toChannelId: string) => void;
  unraid: (fromChannelId: string) => void;
  modUser: (channelId: string, userId: string) => void;
  unmodUser: (channelId: string, userId: string) => void;
  vipUser: (channelId: string, userId: string) => void;
  unvipUser: (channelId: string, userId: string) => void;
  pinMessage?: (channel: string, channelId: string, messageId: string, duration?: number) => void;
}
