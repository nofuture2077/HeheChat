import { ApiClient } from '@twurple/api';
import PubSub from 'pubsub-js';
import { Profile } from '@/commons/profile';
import { createMockApiClient } from './api';
import * as storage from './storage';
import { HeheChatMessage } from '@/commons/message';
import { generateGUID } from '@/commons/helper';

// real Twitch global badge ids, so they render once the channel's badge sets are loaded
const mockUsers: {
  name: string;
  badges: Record<string, string>;
  isMod?: boolean;
  isHehePro?: boolean;
  isHeheAdmin?: boolean;
}[] = [
  { name: 'ChatUser1', badges: {} },
  { name: 'FunViewer', badges: {} },
  { name: 'TwitchFan', badges: { subscriber: '0' } },
  { name: 'StreamLover', badges: { vip: '1', subscriber: '0' }, isHehePro: true },
  {
    name: 'GamerPro',
    badges: { moderator: '1', subscriber: '0', 'sub-gifter': '5', bits: '1000', premium: '1' },
    isMod: true,
  },
  {
    name: 'TheStreamer',
    badges: {
      broadcaster: '1',
      partner: '1',
      subscriber: '0',
      'glhf-pledge': '1',
      turbo: '1',
      'hype-train': '1',
    },
    isHeheAdmin: true,
  },
  { name: 'PredictionAndy', badges: { predictions: 'blue-1', no_audio: '1' } },
];
const mockMessages = [
  'Hello everyone!',
  'Great stream!',
  'How is everyone doing today?',
  'This is awesome!',
  'LOL',
  'GG',
  'Nice play!',
  'Wow, that was amazing!',
  'I love this chat',
  'Having fun here',
  'Okay I have been watching this stream for about three hours now and I just have to say that this is genuinely one of the most entertaining things I have seen all week, keep it up!',
  'Does anyone know which settings they are using? I tried to copy them last night but my game kept crashing after a few minutes and I could not figure out why at all',
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'check this out https://www.example.com/a/very/long/link/that/does/not/break/nicely/at/all?with=query&params=true',
];

let mockMessageInterval: NodeJS.Timeout | null = null;

export function createMockMessage(channels: string[]): HeheChatMessage | undefined {
  if (!channels.length) return undefined;

  const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
  const username = user.name;
  const message = mockMessages[Math.floor(Math.random() * mockMessages.length)];
  const channel = channels[Math.floor(Math.random() * channels.length)];

  return new HeheChatMessage(
    generateGUID(),
    message,
    [{ type: 'text', text: message, name: message }],
    `#${channel}`,
    new Date(),
    {
      displayName: username,
      userId: generateGUID(),
      userName: username.toLowerCase(),
      color: `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')}`,
      badges: user.badges,
      isMod: user.isMod ?? false,
      isHehePro: user.isHehePro ?? false,
      isHeheAdmin: user.isHeheAdmin ?? false,
    },
    '123456789'
  );
}

function startMockMessageGenerator(channels: string[]) {
  if (mockMessageInterval || !channels.length) return;

  mockMessageInterval = setInterval(
    () => {
      const message = createMockMessage(channels);
      if (message) {
        PubSub.publish('WS-msg', {
          message: JSON.stringify(message),
          username: message.userInfo.userName,
        });
      }
    },
    1000 + Math.random() * 2000
  ); // Random interval between 1-3 seconds
}

function stopMockMessageGenerator() {
  if (mockMessageInterval) {
    clearInterval(mockMessageInterval);
    mockMessageInterval = null;
  }
}

export class MockService {
  static startMockMessages(channels: string[]) {
    if (this.isEnabled()) {
      startMockMessageGenerator(channels);
    }
  }

  static stopMockMessages() {
    stopMockMessageGenerator();
  }

  static isEnabled(): boolean {
    return import.meta.env.DEV && import.meta.env.VITE_BYPASS_LOGIN === 'true';
  }

  static createApiClient(client: ApiClient, clientId: string): ApiClient {
    if (!this.isEnabled()) return client;
    return createMockApiClient(client, clientId);
  }

  static async storeProfile(profile: Profile): Promise<void> {
    if (!this.isEnabled()) return;
    const profiles = storage.getProfiles();
    const index = profiles.findIndex((p) => p.guid === profile.guid);
    if (index !== -1) {
      profiles[index] = profile;
    } else {
      profiles.push(profile);
    }
    storage.setProfiles(profiles);
  }

  static async loadProfile(guid: string): Promise<Profile | undefined> {
    if (!this.isEnabled()) return undefined;
    const profiles = storage.getProfiles();
    return profiles.find((p) => p.guid === guid);
  }

  static async deleteProfile(guid: string): Promise<void> {
    if (!this.isEnabled()) return;
    const profiles = storage.getProfiles();
    storage.setProfiles(profiles.filter((p) => p.guid !== guid));
  }

  static async loadProfiles(): Promise<{ active?: string; profiles: string }> {
    if (!this.isEnabled()) return { profiles: '' };
    const activeProfile = storage.getActiveProfile();
    const profiles = storage.getProfiles();
    return {
      active: activeProfile || undefined,
      profiles: profiles.map((p) => p.guid).join(','),
    };
  }

  static async loadProfilesList(): Promise<{ profiles: Profile[] }> {
    if (!this.isEnabled()) return { profiles: [] };
    return { profiles: storage.getProfiles() };
  }

  static async saveProfiles(active: string): Promise<void> {
    if (!this.isEnabled()) return;
    storage.setActiveProfile(active);
  }

  static async loadReceivedShares(): Promise<string[]> {
    if (!this.isEnabled()) return [];
    return storage.getReceivedShares();
  }

  static async loadShares(): Promise<string[]> {
    if (!this.isEnabled()) return [];
    return storage.getShares();
  }

  static async setShares(shares: string[]): Promise<void> {
    if (!this.isEnabled()) return;
    storage.setShares(shares);
  }
}
