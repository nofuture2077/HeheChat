import { Config } from './config';
import PubSub from 'pubsub-js';

export type ShortCutType = 'clip' | 'marker' | 'chat' | 'adbreak' | 'toggle';

// Available config values that can be toggled via shortcuts
export const TOGGLEABLE_CONFIG_VALUES = [
    { value: 'rainMode', label: 'Rain Mode' },
    { value: 'showVideo', label: 'Show Video' },
    { value: 'desktopVideoMode', label: 'Desktop Video' },
    { value: 'chatEnabled', label: 'Chat' },
    { value: 'showTimestamp', label: 'Timestamp' },
    { value: 'modToolsEnabled', label: 'Mod Tools' },
    { value: 'playAlerts', label: 'Play Alerts' },
];

export interface ShortCut {
    id: string;
    name: string;
    color: string;
    type: ShortCutType;
    confirm: boolean;
    input: boolean;
    params: string[];
}

class ShortCutHandler {
    private config?: Config;

    setConfig(config: Config) {
        this.config = config;
    }

    private toggleConfigValue(configKey: string) {
        if (!this.config) return;

        // Map of config keys to their setter functions
        const toggleMethods: Record<string, () => void> = {
            'rainMode': () => this.config!.setRainMode(!this.config!.rainMode),
            'showVideo': () => this.config!.setShowVideo(!this.config!.showVideo),
            'desktopVideoMode': () => this.config!.setDesktopVideoMode(!this.config!.desktopVideoMode),
            'chatEnabled': () => this.config!.setChatEnabled(!this.config!.chatEnabled),
            'showTimestamp': () => this.config!.setShowTimestamp(!this.config!.showTimestamp),
            'showProfilePicture': () => this.config!.setShowProfilePicture(!this.config!.showProfilePicture),
            'showImportantBadges': () => this.config!.setShowImportantBadges(!this.config!.showImportantBadges),
            'showSubBadges': () => this.config!.setShowSubBadges(!this.config!.showSubBadges),
            'showPredictions': () => this.config!.setShowPredictions(!this.config!.showPredictions),
            'showOtherBadges': () => this.config!.setShowOtherBadges(!this.config!.showOtherBadges),
            'hideViewers': () => this.config!.setHideViewers(!this.config!.hideViewers),
            'hideOwnViewers': () => this.config!.setHideOwnViewers(!this.config!.hideOwnViewers),
            'hideHypetrain': () => this.config!.setHideHypetrain(!this.config!.hideHypetrain),
            'hidePrediction': () => this.config!.setHidePrediction(!this.config!.hidePrediction),
            'hidePoll': () => this.config!.setHideePoll(!this.config!.hidePoll),
            'hideShoutout': () => this.config!.setHideShoutout(!this.config!.hideShoutout),
            'hideRaid': () => this.config!.setHideRaid(!this.config!.hideRaid),
            'hideAdBreak': () => this.config!.setHideAdBreak(!this.config!.hideAdBreak),
            'disableEmoteDialog': () => this.config!.setDisableEmoteDialog(!this.config!.disableEmoteDialog),
            'modToolsEnabled': () => this.config!.setModToolsEnabled(!this.config!.modToolsEnabled),
            'playAlerts': () => this.config!.setPlayAlerts(!this.config!.playAlerts),
            'browserSourceAudio': () => this.config!.setBrowserSourceAudio(!this.config!.browserSourceAudio),
            'browserSourceVisual': () => this.config!.setBrowserSourceVisual(!this.config!.browserSourceVisual),
            'checkBrowsersourceConnection': () => this.config!.setCheckBrowsersourceConnection(!this.config!.checkBrowsersourceConnection),
            'skipEmotesInTTS': () => this.config!.setSkipEmotesInTTS(!this.config!.skipEmotesInTTS),
            'skip7TVEmotesInTTS': () => this.config!.setSkip7TVEmotesInTTS(!this.config!.skip7TVEmotesInTTS),
            'skipGlobalEmotesInTTS': () => this.config!.setSkipGlobalEmotesInTTS(!this.config!.skipGlobalEmotesInTTS),
            'show7TVCosmetics': () => this.config!.setShow7TVCosmetics(!this.config!.show7TVCosmetics),
            'reloadOnReturnToApp': () => this.config!.setReloadOnReturnToApp(!this.config!.reloadOnReturnToApp),
        };

        const toggleMethod = toggleMethods[configKey];
        if (toggleMethod) {
            toggleMethod();
            console.log(`Toggled ${configKey} to:`, (this.config as any)[configKey]);
        } else {
            console.error(`Unknown config key for toggle: ${configKey}`);
        }
    }

    handle(shortCut: ShortCut, channelId: string, inputValue: string) {
        console.log(shortCut, channelId, inputValue);
        switch (shortCut.type) {
            case 'chat':
                // Send chat message
                PubSub.publish('WSSEND', {
                    type: 'sendMessage',
                    channel: channelId,
                    text: inputValue || shortCut.params[0] || ''
                });
                break;

            case 'clip':
                // Create clip
                PubSub.publish('WSSEND', {
                    type: 'createClip',
                    channelId
                });
                break;

            case 'marker':
                // Create stream marker
                PubSub.publish('WSSEND', {
                    type: 'createStreamMarker',
                    channelId,
                    description: inputValue || shortCut.params[0] || ''
                });
                break;


            case 'adbreak':
                // Trigger ad break
                PubSub.publish('WSSEND', {
                    type: 'startCommercial',
                    channelId,
                    duration: parseInt(shortCut.params[0] || '60', 10)
                });
                break;

            case 'toggle':
                // Toggle config value
                if (!this.config) {
                    console.error('Config not set for toggle shortcut');
                    return;
                }
                
                const configKey = shortCut.params[0];
                if (!configKey) {
                    console.error('No config key specified for toggle shortcut');
                    return;
                }

                this.toggleConfigValue(configKey);
                break;
        }
    }
}

export const shortcutHandler = new ShortCutHandler();
