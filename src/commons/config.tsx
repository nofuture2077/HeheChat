import { SystemMessageMainType, SmartFilterConfig } from '../commons/message';
import { ShortCut } from './shortcuts';

export const DEFAULT_SMART_FILTER: SmartFilterConfig = {
    enabled: false,
    skipEmoteOnly: true,
    skipReplies: true,
    skipShort: true,
    minWords: 2,
    skipLong: false,
    maxWords: 40,
    skipLinks: true,
    skipSpam: true
};

export type MessageHandler = {id?: number, handle: (channel: string, text: string, replyTo?: string) => void};

export type NotificationSettingType = 'streamStartChannels' | 'chatMentionChannels' | 'chatMentionUsers' | 'chatMention';

export interface NotificationSettings {
    // Channel-specific notification settings
    streamStartChannels?: string[];
    chatMentionChannels?: string[];
    chatMentionUsers?: string[];
    // Global notification settings
    chatMention?: boolean;
}

export interface ConfigData {
    channels: string[];
    showVideo: boolean;
    desktopVideoMode: boolean;
    videoQuality: string;
    chatChannel?: string;
    chatEnabled: boolean;
    ignoredUsers: string[];
    maxMessages: number;
    showTimestamp: boolean;
    showProfilePicture: boolean;
    showPlatformLogo: boolean;
    showImportantBadges: boolean;
    showSubBadges: boolean;
    showPredictions: boolean;
    showOtherBadges: boolean;
    maxBadges: number;
    hideViewers: boolean;
    hideOwnViewers: boolean;
    hideHypetrain: boolean;
    hidePrediction: boolean;
    hidePoll: boolean;
    hideShoutout: boolean;
    hideRaid: boolean;
    hideAdBreak: boolean;
    disableEmoteDialog: boolean;
    fontSize: number;
    compactMode: boolean;
    modToolsEnabled: boolean;
    raidTargets: string[];
    playAlerts: boolean;
    browserSourceAudio: boolean;
    browserSourceVisual: boolean;
    checkBrowsersourceConnection: boolean;
    alertBoost: number;
    visualAlertDelay: number;
    skipEmotesInTTS: boolean;
    skip7TVEmotesInTTS: boolean;
    skipGlobalEmotesInTTS: boolean;
    show7TVCosmetics: boolean;
    systemMessageInChat: Partial<Record<SystemMessageMainType, boolean>>,
    hideEvents: Partial<Record<SystemMessageMainType, boolean>>,
    receivedShares: string[],
    activatedShares: string[],
    shares: string[],
    freeTTS: string[],
    ignoreTTS: string[],
    readAllMessages: boolean,
    smartFilter: SmartFilterConfig,
    deactivatedAlerts: Record<string, boolean>,
    shortcuts: ShortCut[],
    reloadOnReturnToApp: boolean,
    rainMode: boolean,
    missedAlertsWindow: string,
    showBitrateIndicator: boolean,
    showSceneName: boolean,
    showMoblinZoom: boolean,
    mediaPlayerEnabled: boolean,
    cyclingHudEnabled: boolean,
    cyclingHudLocation: boolean,
    cyclingHudLocationCity: boolean,
    cyclingHudLocationRegion: boolean,
    cyclingHudLocationCountry: boolean,
    cyclingHudLocationFlag: boolean,
    cyclingHudLocationTemperature: boolean,
    cyclingHudLocationLocalTime: boolean,
    cyclingHudDistance: boolean,
    cyclingHudSpeed: boolean,
    cyclingHudGradient: boolean,
    cyclingHudElevation: boolean,
    cyclingHudHeartRate: boolean,
    cyclingHudPower: boolean,
    cyclingHudSplit: boolean,
    cyclingHudShowMax: boolean,
    cyclingHudDebug: boolean,
    cyclingHudShowLogo: boolean,
    cyclingHudDelaySeconds: number,
    cyclingHudMinSpeedKmh: number,
    cyclingHudMinGradientPercent: number,
    cyclingHudGradientOnlyWhenMoving: boolean,
    cyclingHudHideLingerSeconds: number,
    cyclingHudPauseEnabled: boolean,
    cyclingHudPauseStartAfterSeconds: number,
    cyclingHudPauseResumeSpeedKmh: number,
    cyclingHudPauseMinDistanceM: number,
    cyclingHudMaxHeartRateBpm: number,
    cyclingHudAveragePowerWatts: number,
    cyclingHudTheme: 'classic' | 'mono' | 'matrix' | 'japan',
    cyclingHudLayout: 'default' | 'cockpit',
    showSceneSwitchNotifications: boolean,
    chatBsTransparentBg: boolean,
    chatBsTextColor: string,
    chatBsMessageLifetime: number,
    chatBsAnimateIn: 'slide' | 'fade' | 'none',
    chatBsAnimateOut: 'fade' | 'none',
    chatBsFontSize: number,
    chatBsMaxMessages: number,
    chatBsPadding: number,
    chatBsWidth: string,
    chatBsHeight: string,
    chatBsShowSystem: boolean,
    chatBsShowImportantBadges: boolean,
    chatBsShowSubBadges: boolean,
    chatBsShowOtherBadges: boolean,
    chatBsShow7TVBadges: boolean,
    chatBsShowHeheBadges: boolean,
    chatBsTextShadow: boolean,
    chatBsShowUsername: boolean,
    chatBsMsgBackground: 'none' | 'dark' | 'light',
    chatBsIgnoredUsers: string[],
    chatBsMsgSpacing: number,
    chatBsFontFamily: string,
    chatBsMaxBadges: number,
    showGpxMap: boolean,
    showGpxElevationMap: boolean,
    showGpxPosition: boolean,
    showGpxElevationPosition: boolean,
    showGpxRemainingDistance: boolean,
    showGpxRemainingElevation: boolean,
    showGpxWaypoints: boolean,
    gpxMapRadius: number | null,
    recentEventsCount: number,
    recentEventsCompact: boolean,
    songRequestDisplayCount: number,
}

export type ConfigKey = keyof ConfigData;

export interface Config extends ConfigData {
    setChannels: (channels: string[]) => void;
    setIgnoredUsers: (users: string[]) => void;
    setMaxMessages: (value: number) => void,
    setShowTimestamp: (value: boolean) => void;
    setShowProfilePicture: (value: boolean) => void;
    setShowPlatformLogo: (value: boolean) => void;
    setShowImportantBadges: (value: boolean) => void;
    setShowSubBadges: (value: boolean) => void;
    setShowPredictions: (value: boolean) => void;
    setShowOtherBadges: (value: boolean) => void;
    setMaxBadges: (val: number) => void;
    getChatChannel: () => string | undefined;
    setChatChannel: (channel: string) => void;
    setChatEnabled: (val: boolean) => void;
    onMessage: (handler: MessageHandler) => MessageHandler;
    off: (handler: MessageHandler) => void;
    fireMessage: (channel: string, text: string, replyTo?: string) => void;
    setFontSize: (val: number) => void;
    setCompactMode: (val: boolean) => void;
    setModToolsEnabled: (val: boolean) => void;
    setRaidTargets: (val: string[]) => void;
    setPlayAlerts: (val: boolean) => void;
    setAlertBoost: (val: number) => void;
    setVisualAlertDelay: (val: number) => void;
    setSkipEmotesInTTS: (val: boolean) => void;
    setSkip7TVEmotesInTTS: (val: boolean) => void;
    setSkipGlobalEmotesInTTS: (val: boolean) => void;
    setShow7TVCosmetics: (val: boolean) => void;
    setSystemMessageInChat: (type: SystemMessageMainType, val: boolean) => void;
    setHideEvents: (type: SystemMessageMainType, val: boolean) => void;
    loadReceivedShares: () => void;
    setActivatedShares: (val: string[]) => void;
    setShares: (val: string[]) => void;
    loadShares: () => void;
    setDeactivatedAlerts: (id: string, val: boolean) => void;
    setShowVideo: (val: boolean) => void;
    setDesktopVideoMode: (val: boolean) => void;
    setVideoQuality: (val: string) => void;
    setHideViewers: (val: boolean) => void;
    setHideOwnViewers: (val: boolean) => void;
    setHideHypetrain: (val: boolean) => void;
    setHidePrediction: (val: boolean) => void;
    setHideePoll: (val: boolean) => void;
    setHideShoutout: (val: boolean) => void;
    setHideRaid: (val: boolean) => void;
    setHideAdBreak: (val: boolean) => void;
    setDisableEmoteDialog: (val: boolean) => void;
    setBrowserSourceAudio: (val: boolean) => void;
    setBrowserSourceVisual: (val: boolean) => void;
    setCheckBrowsersourceConnection: (val: boolean) => void;
    setFreeTTS: (val: string[]) => void;
    setIgnoreTTS: (val: string[]) => void;
    setShortcuts: (val: ShortCut[]) => void;
    setReloadOnReturnToApp: (val: boolean) => void;
    setRainMode: (val: boolean) => void;
    setReadAllMessages: (val: boolean) => void;
    setSmartFilter: (val: Partial<SmartFilterConfig>) => void;
    setMissedAlertsWindow: (val: string) => void;
    setShowBitrateIndicator: (val: boolean) => void;
    setShowSceneName: (val: boolean) => void;
    setShowMoblinZoom: (val: boolean) => void;
    setMediaPlayerEnabled: (val: boolean) => void;
    setCyclingHudEnabled: (val: boolean) => void;
    setCyclingHudShowLogo: (val: boolean) => void;
    setCyclingHudLocation: (val: boolean) => void;
    setCyclingHudLocationCity: (val: boolean) => void;
    setCyclingHudLocationRegion: (val: boolean) => void;
    setCyclingHudLocationCountry: (val: boolean) => void;
    setCyclingHudLocationFlag: (val: boolean) => void;
    setCyclingHudLocationTemperature: (val: boolean) => void;
    setCyclingHudLocationLocalTime: (val: boolean) => void;
    setCyclingHudDistance: (val: boolean) => void;
    setCyclingHudSpeed: (val: boolean) => void;
    setCyclingHudGradient: (val: boolean) => void;
    setCyclingHudElevation: (val: boolean) => void;
    setCyclingHudHeartRate: (val: boolean) => void;
    setCyclingHudPower: (val: boolean) => void;
    setCyclingHudSplit: (val: boolean) => void;
    setCyclingHudShowMax: (val: boolean) => void;
    setCyclingHudDebug: (val: boolean) => void;
    setCyclingHudDelaySeconds: (val: number) => void;
    setCyclingHudMinSpeedKmh: (val: number) => void;
    setCyclingHudMinGradientPercent: (val: number) => void;
    setCyclingHudGradientOnlyWhenMoving: (val: boolean) => void;
    setCyclingHudHideLingerSeconds: (val: number) => void;
    setCyclingHudPauseEnabled: (val: boolean) => void;
    setCyclingHudPauseStartAfterSeconds: (val: number) => void;
    setCyclingHudPauseResumeSpeedKmh: (val: number) => void;
    setCyclingHudPauseMinDistanceM: (val: number) => void;
    setCyclingHudMaxHeartRateBpm: (val: number) => void;
    setCyclingHudAveragePowerWatts: (val: number) => void;
    setCyclingHudTheme: (val: 'classic' | 'mono' | 'matrix' | 'japan') => void;
    setCyclingHudLayout: (val: 'default' | 'cockpit') => void;
    setShowSceneSwitchNotifications: (val: boolean) => void;
    setChatBsTransparentBg: (val: boolean) => void;
    setChatBsTextColor: (val: string) => void;
    setChatBsMessageLifetime: (val: number) => void;
    setChatBsAnimateIn: (val: 'slide' | 'fade' | 'none') => void;
    setChatBsAnimateOut: (val: 'fade' | 'none') => void;
    setChatBsFontSize: (val: number) => void;
    setChatBsMaxMessages: (val: number) => void;
    setChatBsPadding: (val: number) => void;
    setChatBsWidth: (val: string) => void;
    setChatBsHeight: (val: string) => void;
    setChatBsShowSystem: (val: boolean) => void;
    setChatBsShowImportantBadges: (val: boolean) => void;
    setChatBsShowSubBadges: (val: boolean) => void;
    setChatBsShowOtherBadges: (val: boolean) => void;
    setChatBsShow7TVBadges: (val: boolean) => void;
    setChatBsShowHeheBadges: (val: boolean) => void;
    setChatBsTextShadow: (val: boolean) => void;
    setChatBsShowUsername: (val: boolean) => void;
    setChatBsMsgBackground: (val: 'none' | 'dark' | 'light') => void;
    setChatBsIgnoredUsers: (val: string[]) => void;
    setChatBsMsgSpacing: (val: number) => void;
    setChatBsFontFamily: (val: string) => void;
    setChatBsMaxBadges: (val: number) => void;
    setShowGpxMap: (val: boolean) => void;
    setShowGpxElevationMap: (val: boolean) => void;
    setShowGpxPosition: (val: boolean) => void;
    setShowGpxElevationPosition: (val: boolean) => void;
    setShowGpxRemainingDistance: (val: boolean) => void;
    setShowGpxRemainingElevation: (val: boolean) => void;
    setShowGpxWaypoints: (val: boolean) => void;
    setGpxMapRadius: (val: number | null) => void;
    setRecentEventsCount: (val: number) => void;
    setRecentEventsCompact: (val: boolean) => void;
    setSongRequestDisplayCount: (val: number) => void;
}

export const DEFAULT_CONFIG: Config = {
    channels: [],
    showVideo: false,
    desktopVideoMode: true,
    videoQuality: '480p',
    chatChannel: undefined,
    chatEnabled: true,
    ignoredUsers: [],
    maxMessages: 200,
    showTimestamp: false,
    showProfilePicture: true,
    showPlatformLogo: true,
    showImportantBadges: true,
    showSubBadges: true,
    showPredictions: false,
    showOtherBadges: false,
    maxBadges: 3,
    fontSize: 14,
    compactMode: false,
    modToolsEnabled: false,
    raidTargets: [],
    playAlerts: false,
    alertBoost: 1.0,
    visualAlertDelay: 8,
    skipEmotesInTTS: true,
    skip7TVEmotesInTTS: false,
    skipGlobalEmotesInTTS: false,
    show7TVCosmetics: true,
    hideViewers: false,
    hideOwnViewers: false,
    hideHypetrain: false,
    hidePrediction: false,
    hidePoll: false,
    hideShoutout: false,
    hideRaid: false,
    hideAdBreak: false,
    disableEmoteDialog: false,
    browserSourceAudio: true,
    browserSourceVisual: true,
    checkBrowsersourceConnection: true,
    systemMessageInChat: {
        sub: true,
        subgift: true,
        subgiftb: true,
        raid: true,
        follow: true,
        donation: true,
        cheer: true,
        streamOnline: true,
        streamOffline: true,
        channelPointRedemption: true,
        streak: true
    },
    hideEvents: {
        sub: false,
        subgift: false,
        subgiftb: false,
        raid: false,
        follow: true,
        donation: false,
        channelPointRedemption: true,
        hypetrain: true
    },
    receivedShares: [],
    activatedShares: [],
    shares: [],
    freeTTS: [],
    ignoreTTS: [],
    deactivatedAlerts: {},
    shortcuts: [],
    reloadOnReturnToApp: true,
    rainMode: false,
    readAllMessages: false,
    smartFilter: DEFAULT_SMART_FILTER,
    missedAlertsWindow: '15m',
    showBitrateIndicator: false,
    showSceneName: false,
    showMoblinZoom: false,
    mediaPlayerEnabled: false,
    cyclingHudEnabled: true,
    cyclingHudLocation: true,
    cyclingHudLocationCity: true,
    cyclingHudLocationRegion: false,
    cyclingHudLocationCountry: false,
    cyclingHudLocationFlag: true,
    cyclingHudLocationTemperature: false,
    cyclingHudLocationLocalTime: false,
    cyclingHudDistance: true,
    cyclingHudSpeed: true,
    cyclingHudGradient: true,
    cyclingHudElevation: true,
    cyclingHudHeartRate: true,
    cyclingHudPower: true,
    cyclingHudSplit: false,
    cyclingHudShowMax: false,
    cyclingHudDebug: false,
    cyclingHudShowLogo: false,
    cyclingHudDelaySeconds: 10,
    cyclingHudMinSpeedKmh: 1,
    cyclingHudMinGradientPercent: 1,
    cyclingHudGradientOnlyWhenMoving: true,
    cyclingHudHideLingerSeconds: 10,
    cyclingHudPauseEnabled: false,
    cyclingHudPauseStartAfterSeconds: 30,
    cyclingHudPauseResumeSpeedKmh: 8,
    cyclingHudPauseMinDistanceM: 100,
    cyclingHudMaxHeartRateBpm: 190,
    cyclingHudAveragePowerWatts: 250,
    cyclingHudTheme: 'classic',
    cyclingHudLayout: 'default',
    showSceneSwitchNotifications: true,
    chatBsTransparentBg: true,
    chatBsTextColor: '',
    chatBsMessageLifetime: 15,
    chatBsAnimateIn: 'slide',
    chatBsAnimateOut: 'fade',
    chatBsFontSize: 14,
    chatBsMaxMessages: 5,
    chatBsPadding: 4,
    chatBsWidth: '100%',
    chatBsHeight: '100%',
    chatBsShowSystem: false,
    chatBsShowImportantBadges: true,
    chatBsShowSubBadges: true,
    chatBsShowOtherBadges: false,
    chatBsShow7TVBadges: true,
    chatBsShowHeheBadges: true,
    chatBsTextShadow: true,
    chatBsShowUsername: true,
    chatBsMsgBackground: 'none',
    setChannels: () => {},
    setIgnoredUsers: () => {},
    setMaxMessages: (value: number) => {},
    setShowTimestamp: (value: boolean) => {},
    setShowProfilePicture: (value: boolean) => {},
    setShowPlatformLogo: (value: boolean) => {},
    setShowImportantBadges: (value: boolean) => {},
    setShowSubBadges: (value: boolean) => {},
    setShowPredictions: (value: boolean) => {},
    setShowOtherBadges: (value: boolean) => {},
    getChatChannel: () => { return undefined; },
    setChatChannel: (channel: string) => {},
    setChatEnabled: (val: boolean) => {},
    setShowVideo: (val: boolean) => {},
    setDesktopVideoMode: (val: boolean) => {},
    setVideoQuality: (val: string) => {},
    onMessage: (handler: MessageHandler) => ({handle: () => {}}),
    off: (handler: MessageHandler) => {},
    fireMessage: (channel: string, text: string, replyTo?: string) => {},
    setFontSize: (val) => {},
    setCompactMode: (val) => {},
    setModToolsEnabled: (val) => {},
    setRaidTargets: (val) => {},
    setPlayAlerts: (val) => {},
    setHideHypetrain: (val) => {},
    setHidePrediction: (val) => {},
    setHideePoll: (val) => {},
    setHideShoutout: (val) => {},
    setHideRaid: (val) => {},
    setHideAdBreak: (val) => {},
    setDisableEmoteDialog: (val) => {},
    setSystemMessageInChat: (type: SystemMessageMainType, val: boolean) => {},
    setHideEvents: (type: SystemMessageMainType, val: boolean) => {},
    setDeactivatedAlerts: (id: string, val: boolean) => {},
    loadReceivedShares: () => {},
    setActivatedShares: (val: string[]) => {},
    setShares: (val: string[]) => {},
    setHideViewers: (val: boolean) => {},
    setHideOwnViewers: (val: boolean) => {},
    loadShares: () => {},
    setFreeTTS: (val: string[]) => {},
    setIgnoreTTS: (val: string[]) => {},
    setShortcuts: (val: ShortCut[]) => {},
    setBrowserSourceAudio: (val) => {},
    setBrowserSourceVisual: (val) => {},
    setCheckBrowsersourceConnection: (val) => {},
    setAlertBoost: (val) => {},
    setVisualAlertDelay: (val) => {},
    setSkipEmotesInTTS: (val) => {},
    setSkip7TVEmotesInTTS: (val) => {},
    setSkipGlobalEmotesInTTS: (val) => {},
    setShow7TVCosmetics: (val) => {},
    setReloadOnReturnToApp: (val) => {},
    setRainMode: (val) => {},
    setReadAllMessages: (val) => {},
    setSmartFilter: (val) => {},
    setMissedAlertsWindow: (_val: string) => {},
    setShowBitrateIndicator: (val) => {},
    setShowSceneName: (val) => {},
    setShowMoblinZoom: (val) => {},
    setMediaPlayerEnabled: (val) => {},
    setCyclingHudEnabled: (val) => {},
    setCyclingHudShowLogo: (val) => {},
    setCyclingHudLocation: (val) => {},
    setCyclingHudLocationCity: (val) => {},
    setCyclingHudLocationRegion: (val) => {},
    setCyclingHudLocationCountry: (val) => {},
    setCyclingHudLocationFlag: (val) => {},
    setCyclingHudLocationTemperature: (val) => {},
    setCyclingHudLocationLocalTime: (val) => {},
    setCyclingHudDistance: (val) => {},
    setCyclingHudSpeed: (val) => {},
    setCyclingHudGradient: (val) => {},
    setCyclingHudElevation: (val) => {},
    setCyclingHudHeartRate: (val) => {},
    setCyclingHudPower: (val) => {},
    setCyclingHudSplit: (val) => {},
    setCyclingHudShowMax: (val) => {},
    setCyclingHudDebug: (val) => {},
    setCyclingHudDelaySeconds: (val) => {},
    setCyclingHudMinSpeedKmh: (val) => {},
    setCyclingHudMinGradientPercent: (val) => {},
    setCyclingHudGradientOnlyWhenMoving: (val) => {},
    setCyclingHudHideLingerSeconds: (val) => {},
    setCyclingHudPauseEnabled: (val) => {},
    setCyclingHudPauseStartAfterSeconds: (val) => {},
    setCyclingHudPauseResumeSpeedKmh: (val) => {},
    setCyclingHudPauseMinDistanceM: (val) => {},
    setCyclingHudMaxHeartRateBpm: (val) => {},
    setCyclingHudAveragePowerWatts: (val) => {},
    setCyclingHudTheme: (val) => {},
    setCyclingHudLayout: (val) => {},
    setShowSceneSwitchNotifications: (val) => {},
    setChatBsTransparentBg: () => {},
    setChatBsTextColor: () => {},
    setChatBsMessageLifetime: () => {},
    setChatBsAnimateIn: () => {},
    setChatBsAnimateOut: () => {},
    setChatBsFontSize: () => {},
    setChatBsMaxMessages: () => {},
    setChatBsPadding: () => {},
    setChatBsWidth: () => {},
    setChatBsHeight: () => {},
    setChatBsShowSystem: () => {},
    setChatBsShowImportantBadges: () => {},
    setChatBsShowSubBadges: () => {},
    setChatBsShowOtherBadges: () => {},
    setChatBsShow7TVBadges: () => {},
    setChatBsShowHeheBadges: () => {},
    setChatBsTextShadow: () => {},
    setChatBsShowUsername: () => {},
    setChatBsMsgBackground: () => {},
    chatBsIgnoredUsers: [],
    setChatBsIgnoredUsers: () => {},
    chatBsMsgSpacing: 2,
    chatBsFontFamily: '',
    chatBsMaxBadges: 3,
    setChatBsMsgSpacing: () => {},
    setChatBsFontFamily: () => {},
    setChatBsMaxBadges: () => {},
    setMaxBadges: () => {},
    showGpxMap: false,
    showGpxElevationMap: false,
    showGpxPosition: false,
    showGpxElevationPosition: false,
    showGpxRemainingDistance: false,
    showGpxRemainingElevation: false,
    showGpxWaypoints: false,
    gpxMapRadius: null,
    setShowGpxMap: () => {},
    setShowGpxElevationMap: () => {},
    setShowGpxPosition: () => {},
    setShowGpxElevationPosition: () => {},
    setShowGpxRemainingDistance: () => {},
    setShowGpxRemainingElevation: () => {},
    setShowGpxWaypoints: () => {},
    setGpxMapRadius: () => {},
    recentEventsCount: 0,
    recentEventsCompact: true,
    setRecentEventsCount: () => {},
    setRecentEventsCompact: () => {},
    songRequestDisplayCount: 3,
    setSongRequestDisplayCount: () => {},
};

export const DB_VERSION = 9;
export const DB_NAME = 'HeheChat';
