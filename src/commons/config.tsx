export type MessageHandler = {id?: number, handle: (channel: string, text: string, replyTo?: string) => void};

export type ConfigKey = 'channels' | 'chatChannel' | 'ignoredUsers' | 'showTimestamp' | 'showProfilePicture' | 'showImportantBadges' | 'showSubBadges' | 'showPredictions' | 'showOtherBadges' | 'fontSize' | 'modToolsEnabled' | 'raidTargets';

export interface ConfigData {
    channels: string[];
    chatChannel?: string;
    ignoredUsers: string[];
    maxMessages: number;
    showTimestamp: boolean;
    showProfilePicture: boolean;
    showImportantBadges: boolean;
    showSubBadges: boolean;
    showPredictions: boolean;
    showOtherBadges: boolean;
    fontSize: number;
    modToolsEnabled: boolean;
    raidTargets: string[];
}
export interface Config extends ConfigData {
    setChannels: (channels: string[]) => void;
    setIgnoredUsers: (users: string[]) => void;
    setShowTimestamp: (value: boolean) => void;
    setShowProfilePicture: (value: boolean) => void;
    setShowImportantBadges: (value: boolean) => void;
    setShowSubBadges: (value: boolean) => void;
    setShowPredictions: (value: boolean) => void;
    setShowOtherBadges: (value: boolean) => void;
    getChatChannel: () => string | undefined;
    setChatChannel: (channel: string) => void;
    onMessage: (handler: MessageHandler) => MessageHandler;
    off: (handler: MessageHandler) => void;
    fireMessage: (channel: string, text: string, replyTo?: string) => void;
    setFontSize: (val: number) => void;
    setModToolsEnabled: (val: boolean) => void;
    setRaidTargets: (val: string[]) => void;
}

export const DEFAULT_CONFIG: Config = {
    channels: [],
    chatChannel: undefined,
    ignoredUsers: [],
    maxMessages: 500,
    showTimestamp: false,
    showProfilePicture: true,
    showImportantBadges: true,
    showSubBadges: true,
    showPredictions: false,
    showOtherBadges: false,
    fontSize: 14,
    modToolsEnabled: true,
    raidTargets: [],
    setChannels: () => {},
    setIgnoredUsers: () => {},
    setShowTimestamp: (value: boolean) => {},
    setShowProfilePicture: (value: boolean) => {},
    setShowImportantBadges: (value: boolean) => {},
    setShowSubBadges: (value: boolean) => {},
    setShowPredictions: (value: boolean) => {},
    setShowOtherBadges: (value: boolean) => {},
    getChatChannel: () => { return undefined; },
    setChatChannel: (channel: string) => {},
    onMessage: (handler: MessageHandler) => ({handle: () => {}}),
    off: (handler: MessageHandler) => {},
    fireMessage: (channel: string, text: string, replyTo?: string) => {},
    setFontSize: (val) => {},
    setModToolsEnabled: (val) => {},
    setRaidTargets: (val) => {}
};