import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useDidUpdate, useNetwork, useDocumentVisibility } from '@mantine/hooks';
import { useEffect, useState, useRef } from 'react';
import { useWakeLock } from './hooks/useWakeLock';
import { initializeStoragePatches } from './commons/patches';
import { Router } from './Router';
import { ConfigContext, LoginContextContext, ChatEmotesContext, ProfileContext, PremiumContext } from './ApplicationContext';
import { Premium, DEFAULT_PREMIUM } from './commons/premium';
import * as premiumApi from './api/premium';
import { LoginContext, DEFAULT_LOGIN_CONTEXT } from './commons/login';
import { StaticAuthProvider } from '@twurple/auth';
import { ApiClient, HelixModeratedChannel, HelixUser } from '@twurple/api';
import { ConfigKey, DEFAULT_CONFIG, MessageHandler } from './commons/config';
import { ChatEmotes, DEFAULT_CHAT_EMOTES } from './commons/emotes';
import { Profile, DEFAULT_PROFILE } from './commons/profile';
import { generateGUID } from './commons/helper';
import PubSub from 'pubsub-js';
import { SystemMessageMainType } from './commons/message';
import { theme } from './theme';
import { AlertSystem } from './components/alerts/alertplayer';
import { ShortCut } from './commons/shortcuts';
import _ from 'underscore';
import { MockService } from '@/mocks/service';

// Debounce function to prevent excessive API calls
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

window.addEventListener("click", () => {
    if (!AlertSystem.status()) {
        AlertSystem.initialize();
    } 
}); 

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

async function storeProfile(profile: Profile): Promise<any> {
    if (MockService.isEnabled()) {
        return MockService.storeProfile(profile);
    }
    const token = localStorage.getItem('hehe-token_state') || '';
    return fetch(BASE_URL + "/profile?" + [["token", token].join("="), ["guid", profile.guid].join("=")].join("&"), {
        method: 'PUT',
        body: JSON.stringify(profile)
    });
}

async function loadProfileFromServer(guid: String): Promise<Profile> {
    if (MockService.isEnabled()) {
        const profile = await MockService.loadProfile(guid.toString());
        return profile || {...DEFAULT_PROFILE, guid: guid.toString()};
    }
    const token = localStorage.getItem('hehe-token_state') || '';
    return fetch(BASE_URL + "/profile?" + [["token", token].join("="), ["guid", guid].join("=")].join("&")).then(res => res.json());
}

async function deleteProfileFromServer(guid: String): Promise<any> {
    if (MockService.isEnabled()) {
        return MockService.deleteProfile(guid.toString());
    }
    const token = localStorage.getItem('hehe-token_state') || '';
    return fetch(BASE_URL + "/profile?" + [["token", token].join("="), ["guid", guid].join("=")].join("&"), {method: 'DELETE'});
}

async function loadProfilesFromServer(): Promise<{profiles: Profile[]}> {
    if (MockService.isEnabled()) {
        return MockService.loadProfilesList();
    }
    const token = localStorage.getItem('hehe-token_state') || '';
    return fetch(BASE_URL + "/profile/list?" + [["token", token].join("=")].join("&")).then(res => res.json());
}

async function loadProfiles(): Promise<{active?: string, profiles: string}> {
    if (MockService.isEnabled()) {
        return MockService.loadProfiles();
    }
    const token = localStorage.getItem('hehe-token_state') || '';
    return fetch(BASE_URL + "/profiles/list?" + [["token", token].join("=")].join("&")).then(res => res.json());
}

async function saveProfiles(active: string, profiles: string[]): Promise<any> {
    if (MockService.isEnabled()) {
        return MockService.saveProfiles(active);
    }
    const token = localStorage.getItem('hehe-token_state') || '';
    return fetch(BASE_URL + "/profiles/list?" + [["token", token].join("="), ["active", active].join("="), ["profiles", profiles.join(',')].join("=")].join("&"), {
        method: 'PUT'
    });
}

const onMessageHandlers: MessageHandler[] = [];
var onMessageHandlerIndex = 0;

export default function HeheChat() {
    // Run storage patches on app initialization
    useEffect(() => {
        initializeStoragePatches();
    }, []);

    const [loginContext, setLoginContext] = useState<LoginContext>(DEFAULT_LOGIN_CONTEXT);
    const [chatEmotes, setChatEmotes] = useState<ChatEmotes>(DEFAULT_CHAT_EMOTES);
    const [profile, setProfile] = useState<Profile>({...DEFAULT_PROFILE, guid: ''});
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [premium, setPremium] = useState<Premium>({
        ...DEFAULT_PREMIUM,
        loading: true
    });
    const backendWorkerRef = useRef<Worker>();
    
    // Create a debounced save function to prevent excessive API calls
    const debouncedSaveProfile = useRef(
        debounce(async (profileToSave: Profile) => {
            if (!profileToSave.guid) {
                console.error("Saving profile without guid", profileToSave);
                return;
            }
            if (!profileToSave.config.channels || !profileToSave.config.channels.length) {
                return;
            }
            
            try {
                await storeProfile(profileToSave);
            } catch (error) {
                console.error('Error saving profile to server:', error);
            }
        }, 1000)
    ).current;
    
    // Track connection status
    const [connectionStatus, setConnectionStatus] = useState<{
        status: string;
        reconnectAttempts: number;
        lastHeartbeat: string | null;
    }>({
        status: 'CONNECTING',
        reconnectAttempts: 0,
        lastHeartbeat: null
    });
    
    // Get network status and document visibility at component level
    const networkStatus = useNetwork();
    const documentVisible = useDocumentVisibility();
    
    // Initialize wake lock to keep display on while using the app
    const { isSupported: wakeLockSupported, isActive: wakeLockActive, requestWakeLock, releaseWakeLock, error: wakeLockError } = useWakeLock();

    useDidUpdate(() => {
        // Use debounced save to prevent excessive API calls
        debouncedSaveProfile(profile);
    }, [profile])

    useEffect(() => {
        // Load profiles
        loadProfiles().then(async (data) => {
            if (data.active) {
                const profileData = await loadProfileFromServer(data.active);
                profileData.config.channels ??= [];
                profileData.config.raidTargets ??= [];
                profileData.config.hideEvents ??= DEFAULT_CONFIG.hideEvents;
                profileData.config.skipEmotesInTTS ??= true;
                profileData.config.skip7TVEmotesInTTS ??= false;
                profileData.config.skipGlobalEmotesInTTS ??= false;
                profileData.config.checkBrowsersourceConnection ??= true;
                profileData.config.desktopVideoMode ??= true;
                profileData.config.reloadOnReturnToApp ??= true;
                profileData.config.browserSourceVisual ??= true;
                profileData.config.show7TVCosmetics ??= true;
                profileData.config.readAllMessages ??= false;
                profileData.config.visualAlertDelay = profileData.config.visualAlertDelay === undefined ? 8 : profileData.config.visualAlertDelay;
                setProfile(profileData);
                AlertSystem.updateProfile(profileData);
                const order = data.profiles.split(',').filter(x => x);
                loadProfilesFromServer().then(r => {
                    setProfiles(_.sortBy(r.profiles, item => order.indexOf(item.guid)) || [profileData]);
                });
            } else {
                // Only create a new profile if we don't have one
                const newProfile = {...DEFAULT_PROFILE, name: 'default', guid: generateGUID()};
                
                try {
                    // Save the new profile to the server
                    await storeProfile(newProfile);
                    // Update local state
                    AlertSystem.updateProfile(newProfile);
                    setProfile(newProfile);
                    setProfiles([newProfile]);
                    // Save the profile list
                    await saveProfiles(newProfile.guid, [newProfile.guid]);
                } catch (error) {
                    console.error('Error creating initial profile:', error);
                }
            }
        }, (err) => console.error(err));
        
        // Load premium data
        const loadPremiumData = async () => {
            if (!isLoggedIn()) {
                setPremium(prev => ({ 
                    ...prev, 
                    isPremium: false,
                    loading: false
                }));
                return;
            }
            
            setPremium(prev => ({ ...prev, loading: true }));
            
            try {
                const token = localStorage.getItem('hehe-token_state') || '';
                
                // First check status
                const statusResult = await premiumApi.fetchPremiumStatus(token);
                const isPremium = statusResult.premium;
                
                // If premium, also fetch details
                if (isPremium) {
                    const details = await premiumApi.fetchPremiumDetails(token);
                    
                    setPremium(prev => ({
                        ...prev,
                        isPremium: details.isActive,
                        expiresAt: details.expires_at,
                        subscriptionType: details.subscription_type,
                        daysRemaining: details.daysRemaining,
                        status: details.status,
                        loading: false
                    }));
                } else {
                    setPremium(prev => ({ 
                        ...prev, 
                        isPremium: false,
                        loading: false
                    }));
                }
            } catch (error) {
                console.error('Error fetching premium data:', error);
                setPremium(prev => ({ 
                    ...prev, 
                    isPremium: false,
                    loading: false
                }));
            }
        };
        
        loadPremiumData();

        backendWorkerRef.current = new Worker(new URL('./components/webworker/backendworker.ts', import.meta.url), { type: 'module' });

        const psWSSend = PubSub.subscribe("WSSEND", (msg, data) => {
            data.state = localStorage.getItem('hehe-token_state') || '';
            backendWorkerRef.current!.postMessage({type: "SEND", data});
        });

        backendWorkerRef.current.addEventListener("message", (msg: MessageEvent) => {
            // Handle connection status updates
            if (msg.data.type === 'connectionStatus') {
                setConnectionStatus({
                    status: ['CONNECTING', 'CONNECTED', 'DISCONNECTED', 'RECONNECTING'][msg.data.status] || 'UNKNOWN',
                    reconnectAttempts: msg.data.reconnectAttempts,
                    lastHeartbeat: msg.data.lastHeartbeat
                });
                return;
            }
            
            // Forward all other messages to PubSub
            PubSub.publish("WS-" + msg.data.type, msg.data.data);
        });

        loadReceivedShares();

        // Start mock message generator if mock environment is enabled
        if (MockService.isEnabled() && profile.config.channels.length) {
            MockService.startMockMessages(profile.config.channels);
        }

        const psAlertConfig = PubSub.subscribe("WS-alertConfig", (msg, data) => {
            console.log('Alertconfig was updated for: ', data.channel);
            AlertSystem.loadAlertConfig([data.channel]);
        });

        // Add subscription for replay events
        const psReplayEvent = PubSub.subscribe("WS-replayevent", (msg, event) => {
            // Process replay events the same way as regular events
            if (AlertSystem.shouldBePlayedInApp(event)) {
                AlertSystem.addEvent(event);
            }
        });
    
        // Set up a listener for network/visibility changes
        const handleNetworkOrVisibilityChange = () => {
            if (networkStatus.online && documentVisible && backendWorkerRef.current) {
                console.log("Network or visibility changed, forcing reconnection");
                backendWorkerRef.current.postMessage({ type: 'RECONNECT' });
            }
        };
        
        // Initial setup
        window.addEventListener('online', handleNetworkOrVisibilityChange);
        document.addEventListener('visibilitychange', handleNetworkOrVisibilityChange);

        return () => {
            const stopMessage = { type: 'STOP' };
            backendWorkerRef.current?.postMessage(stopMessage);
            PubSub.unsubscribe(psAlertConfig);
            PubSub.unsubscribe(psReplayEvent);
            PubSub.unsubscribe(psWSSend);
            
            // Remove event listeners
            window.removeEventListener('online', handleNetworkOrVisibilityChange);
            document.removeEventListener('visibilitychange', handleNetworkOrVisibilityChange);
            
            // Stop mock message generator
            MockService.stopMockMessages();
        }
    }, []);

    useEffect(() => {
        const updateProfilesList = async () => {
            if (profiles.length) {
                try {
                    await saveProfiles(profile.guid, profiles.map(p => p.guid));
                } catch (error) {
                    console.error('Error saving profiles list:', error);
                    // Could add user notification here
                }
            }
        };
        
        updateProfilesList();
    }, [profiles]);

    useEffect(() => {
        const updatedArray = profiles.map(obj =>
            obj.guid === profile.guid ? profile : obj
        );
        
        // Only update if there's an actual change to prevent infinite loops
        const hasChanged = profiles.some((p, index) => 
            p.guid === profile.guid && JSON.stringify(p) !== JSON.stringify(updatedArray[index])
        );
        
        if (hasChanged) {
            setProfiles(updatedArray);
        }
        AlertSystem.updateProfile(profile);
    }, [profile]);

    // Restart mock messages when channels change
    useEffect(() => {
        if (MockService.isEnabled()) {
            MockService.stopMockMessages();
            if (profile.config.channels.length) {
                MockService.startMockMessages(profile.config.channels);
            }
        }
    }, [profile.config.channels]);

    // Manage wake lock based on document visibility and app usage
    useEffect(() => {
        if (wakeLockSupported && documentVisible) {
            // Request wake lock when document becomes visible
            requestWakeLock();
        }
        // Wake lock will be automatically released when document becomes hidden
        // The useWakeLock hook handles reacquisition when document becomes visible again
    }, [documentVisible, wakeLockSupported, requestWakeLock]);

    // Log wake lock status changes for debugging
    useEffect(() => {
        if (wakeLockError) {
            console.warn('Wake lock error:', wakeLockError);
        }
        if (wakeLockActive) {
            console.log('Screen wake lock is active - display will stay on');
        }
    }, [wakeLockActive, wakeLockError]);

    const updateConfig = (key: ConfigKey, value: any) => {
        setProfile((profile) => {
            const newProfile = { ...profile, config: { ...profile.config, [key]: value } };
            return newProfile;
        });
    }

    const setChannels = (value: string[]) => updateConfig('channels', value);
    const setIgnoredUsers = (value: string[]) => updateConfig('ignoredUsers', value);
    const setMaxMessages = (value: number) => updateConfig('maxMessages', value);
    const setShowTimestamp = (value: boolean) => updateConfig('showTimestamp', value);
    const setShowProfilePicture = (value: boolean) => updateConfig('showProfilePicture', value);
    const setShowImportantBadges = (value: boolean) => updateConfig('showImportantBadges', value);
    const setShowSubBadges = (value: boolean) => updateConfig('showSubBadges', value);
    const setShowPredictions = (value: boolean) => updateConfig('showPredictions', value);
    const setShowOtherBadges = (value: boolean) => updateConfig('showOtherBadges', value);
    const setFontSize = (value: number) => updateConfig('fontSize', value);
    const setModToolsEnabled = (value: boolean) => updateConfig('modToolsEnabled', value);
    const setPlayAlerts = (value: boolean) => updateConfig('playAlerts', value);
    const setShowVideo = (value: boolean) => updateConfig('showVideo', value);
    const setDesktopVideoMode = (value: boolean) => updateConfig('desktopVideoMode', value);
    const setVideoQuality = (value: string) => updateConfig('videoQuality', value);
    const setRaidTargets = (value: string[]) => updateConfig('raidTargets', value);
    const setFreeTTS = (value: string[]) => updateConfig('freeTTS', value);
    const setIgnoreTTS = (value: string[]) => updateConfig('ignoreTTS', value);
    const setChatEnabled = (value: boolean) => updateConfig('chatEnabled', value);
    const setHideViewers = (value: boolean) => updateConfig('hideViewers', value);
    const setHideOwnViewers = (value: boolean) => updateConfig('hideOwnViewers', value);
    const setHideHypetrain = (value: boolean) => updateConfig('hideHypetrain', value);
    const setHidePoll = (value: boolean) => updateConfig('hidePoll', value);
    const setHidePrediction = (value: boolean) => updateConfig('hidePrediction', value);
    const setHideRaid = (value: boolean) => updateConfig('hideRaid', value);
    const setHideAdBreak = (value: boolean) => updateConfig('hideAdBreak', value);
    const setHideShoutout = (value: boolean) => updateConfig('hideShoutout', value);
    const setDisableEmoteDialog = (value: boolean) => updateConfig('disableEmoteDialog', value);
    const setShortcuts = (value: ShortCut[]) => updateConfig('shortcuts', value);
    const setBrowserSourceAudio = (value: boolean) => updateConfig('browserSourceAudio', value);
    const setBrowserSourceVisual = (value: boolean) => updateConfig('browserSourceVisual', value);
    const setCheckBrowsersourceConnection = (value: boolean) => updateConfig('checkBrowsersourceConnection', value);
    const setAlertBoost = (value: number) => updateConfig('alertBoost', value);
    const setVisualAlertDelay = (value: number) => updateConfig('visualAlertDelay', value);
    const setSkipEmotesInTTS = (value: boolean) => updateConfig('skipEmotesInTTS', value);
    const setSkip7TVEmotesInTTS = (value: boolean) => updateConfig('skip7TVEmotesInTTS', value);
    const setSkipGlobalEmotesInTTS = (value: boolean) => updateConfig('skipGlobalEmotesInTTS', value);
    const setShow7TVCosmetics = (value: boolean) => updateConfig('show7TVCosmetics', value);
    const setReloadOnReturnToApp = (value: boolean) => updateConfig('reloadOnReturnToApp', value);
    const setRainMode = (value: boolean) => updateConfig('rainMode', value);
    const setReadAllMessages = (value: boolean) => updateConfig('readAllMessages', value);

    const getChatChannel = () => {
        if (profile.config.channels.includes(profile.config.chatChannel || '')) {
            return profile.config.chatChannel;
        } else {
            if (profile.config.channels.length == 0) {
                return;
            }
            const channel = profile.config.channels[0];
            setChatChannel(channel);
            return channel;
        }
    }
    const setChatChannel = (value: string) => updateConfig('chatChannel', value);
    const setAccessToken = async (accessToken: string | undefined) => {
        setLoginContext((loginContext) => {
            const newContext = { ...loginContext, accessToken };
            return newContext;
        });
    }

    const setUser = async (user: HelixUser) => {
        setLoginContext((loginContext) => {
            const newContext = { ...loginContext, user };
            return newContext;
        });
    }

    const setModeratedChannels = async (moderatedChannels: HelixModeratedChannel[]) => {
        setLoginContext((loginContext) => {
            const newContext = { ...loginContext, moderatedChannels };
            return newContext;
        });
    }

    const isLoggedIn = () => {
        return MockService.isEnabled() || !!loginContext.accessToken;
    }

    const getAuthProvider = () => {
        return new StaticAuthProvider(loginContext.clientId, loginContext.accessToken || '');
    };

    const getApiClient = () => {
        const client = new ApiClient({ authProvider: getAuthProvider() });
        return MockService.createApiClient(client, loginContext.clientId);
    };

    const onMessage = (handler: MessageHandler) => {
        onMessageHandlers.push(handler);
        handler.id = ++onMessageHandlerIndex;
        return handler;
    };
    const off = (handler: MessageHandler) => {
        const index = onMessageHandlers.findIndex((h) => h.id === handler.id)
        if (index > -1) {
            onMessageHandlers.splice(index, 1);
        }
    };
    const fireMessage = (channel: string, text: string, replyTo?: string) => {
        (onMessageHandlers || []).forEach(handler => {
            handler.handle(channel, text, replyTo);
        });
    };

    const listProfiles = () => {
        return profiles;
    }

    const checkProfileName = (name: string) => {
        if (!name) {
            return false;
        }
        if (name.length > 25) {
            return false;
        }
        for (var i = 0; i < profiles.length;i++) {
            if (name.toLowerCase() === profile.name.toLowerCase()) {
                return false;
            }
        }
        return true;
    }

    const setProfileName = async (name: string) => {
        try {
            const newProfile = { ...profile, name };
            // First save the updated profile to the server
            await storeProfile(newProfile);
            // Then update local state
            setProfile(newProfile);
        } catch (error) {
            console.error('Error updating profile name:', error);
            // Could add user notification here
        }
    };

    const switchProfile = async (guid: string) => {
        const p = profiles.find(p => p.guid === guid);
        if (p) {
            try {
                // First update the active profile on the server
                await saveProfiles(guid, profiles.map(p => p.guid));
                // Then update local state
                setProfile(p);
            } catch (error) {
                console.error('Error switching profile:', error);
                // Could add user notification here
            }
        }
    };

    const createProfile = async (name: string, oldProfile?: Profile) => {
        const guid = generateGUID();
        const newProfile = {...DEFAULT_PROFILE, ...oldProfile, name, guid};
        
        try {
            // First save the new profile to the server
            await storeProfile(newProfile);
            // Then update local state
            setProfile(newProfile);
            setProfiles(profiles => profiles.concat(newProfile));
            // Update the profiles list on the server
            await saveProfiles(newProfile.guid, [...profiles.map(p => p.guid), newProfile.guid]);
        } catch (error) {
            console.error('Error creating profile:', error);
            // Could add user notification here
        }
    };

    const deleteProfile = async (guid: string) => {
        try {
            // First delete the profile from the server
            await deleteProfileFromServer(guid);
            
            // Then update local state
            const updatedProfiles = profiles.filter(p => p.guid !== guid);
            setProfiles(updatedProfiles);
            
            // If we're deleting the active profile, switch to another one
            if (profile.guid === guid && updatedProfiles.length > 0) {
                setProfile(updatedProfiles[0]);
                // Update the active profile on the server
                await saveProfiles(updatedProfiles[0].guid, updatedProfiles.map(p => p.guid));
            }
        } catch (error) {
            console.error('Error deleting profile:', error);
            // Could add user notification here
        }
    }

    const setSystemMessageInChat = (type: SystemMessageMainType, val: boolean) => {
        const sm = profile.config.systemMessageInChat;
        sm[type] = val;
        updateConfig('systemMessageInChat', sm);
    }

    const setHideEvents = (type: SystemMessageMainType, val: boolean) => {
        const he = profile.config.hideEvents;
        he[type] = val;
        updateConfig('hideEvents', he);
    }

    const setDeactivatedAlerts = (type: string, val: boolean) => {
        const da = profile.config.deactivatedAlerts;
        da[type] = val;
        updateConfig('deactivatedAlerts', da);
    }

    const loadReceivedShares = async () => {
        if (MockService.isEnabled()) {
            const shares = await MockService.loadReceivedShares();
            updateConfig('receivedShares', shares);
            return;
        }
        const share = localStorage.getItem('hehe-token_state') || '';
        const data: {shares: string[]} = await fetch(BASE_URL + "/shares?state=" + share).then(res => res.json());
        updateConfig('receivedShares', data.shares);
    }

    const loadShares = async () => {
        if (MockService.isEnabled()) {
            const shares = await MockService.loadShares();
            updateConfig('shares', shares);
            return;
        }
        const share = localStorage.getItem('hehe-token_state') || '';
        const data: {shares: string[]} = await fetch(BASE_URL + "/shares/get?state=" + share).then(res => res.json());
        updateConfig('shares', data.shares);
    }

    const setShares = async (value: string[]) => {
        if (MockService.isEnabled()) {
            await MockService.setShares(value);
            updateConfig('shares', value);
            return;
        }
        const share = localStorage.getItem('hehe-token_state') || '';
        const data: {shares: string[]} = await fetch(BASE_URL + "/shares/set?state=" + share + "&channels=" + value.join(',')).then(res => res.json());
        updateConfig('shares', data.shares);
    }

    const setActivatedShares = (value: string[]) => updateConfig('activatedShares', value);
    
    // These functions have been removed as notification settings are now handled directly in the NotificationSettings component

    const appConfig = {
        ...profile.config,
        setChannels,
        setIgnoredUsers,
        setMaxMessages,
        setShowTimestamp,
        setShowProfilePicture,
        setShowImportantBadges,
        setShowSubBadges,
        setShowPredictions,
        setShowOtherBadges,
        setChatEnabled,
        setChatChannel,
        setShowVideo,
        setDesktopVideoMode,
        setVideoQuality,
        getChatChannel,
        setFontSize,
        setModToolsEnabled,
        setRaidTargets,
        setFreeTTS,
        setIgnoreTTS,
        setPlayAlerts,
        setSystemMessageInChat,
        setHideEvents,
        setDeactivatedAlerts,
        loadReceivedShares,
        setActivatedShares,
        setShares,
        setHideViewers,
        setHideOwnViewers,
        setHideHypetrain,
        setHidePoll,
        setHidePrediction,
        setHideRaid,
        setHideShoutout,
        setHideAdBreak,
        loadShares,
        onMessage,
        off,
        fireMessage,
        setShortcuts,
        setDisableEmoteDialog,
        setBrowserSourceAudio,
        setBrowserSourceVisual,
        setCheckBrowsersourceConnection,
        setAlertBoost,
        setVisualAlertDelay,
        setSkipEmotesInTTS,
        setSkip7TVEmotesInTTS,
        setSkipGlobalEmotesInTTS,
        setShow7TVCosmetics,
        setReloadOnReturnToApp,
        setRainMode,
        setReadAllMessages
    };

    const appLogin = {
        ...loginContext,
        setAccessToken,
        isLoggedIn,
        getAuthProvider,
        getApiClient,
        setUser,
        setModeratedChannels
    };

    // Refresh premium data when login state changes
    useEffect(() => {
        const refreshPremiumData = async () => {
            if (!isLoggedIn()) {
                setPremium(prev => ({ 
                    ...prev, 
                    isPremium: false,
                    loading: false
                }));
                return;
            }
            
            setPremium(prev => ({ ...prev, loading: true }));
            
            try {
                const token = localStorage.getItem('hehe-token_state') || '';
                
                // First check status
                const statusResult = await premiumApi.fetchPremiumStatus(token);
                const isPremium = statusResult.premium;
                
                // If premium, also fetch details
                if (isPremium) {
                    const details = await premiumApi.fetchPremiumDetails(token);
                    
                    setPremium(prev => ({
                        ...prev,
                        isPremium: details.isActive,
                        expiresAt: details.expires_at,
                        subscriptionType: details.subscription_type,
                        daysRemaining: details.daysRemaining,
                        status: details.status,
                        loading: false
                    }));
                } else {
                    setPremium(prev => ({ 
                        ...prev, 
                        isPremium: false,
                        loading: false
                    }));
                }
            } catch (error) {
                console.error('Error refreshing premium data:', error);
                setPremium(prev => ({ 
                    ...prev, 
                    isPremium: false,
                    loading: false
                }));
            }
        };
        
        refreshPremiumData();
    }, [loginContext.accessToken]);
    
    const checkPremiumStatus = async (): Promise<boolean> => {
        if (!loginContext.isLoggedIn()) {
            return false;
        }
        
        try {
            const token = localStorage.getItem('hehe-token_state') || '';
            const statusResult = await premiumApi.fetchPremiumStatus(token);
            const isPremium = statusResult.premium;
            
            setPremium(prev => ({ 
                ...prev, 
                isPremium,
                loading: false
            }));
            
            return isPremium;
        } catch (error) {
            console.error('Error checking premium status:', error);
            setPremium(prev => ({ 
                ...prev, 
                isPremium: false,
                loading: false
            }));
            return false;
        }
    };
    
    const getPremiumDetails = async (): Promise<any> => {        
        setPremium(prev => ({ ...prev, loading: true }));
        
        try {
            const token = localStorage.getItem('hehe-token_state') || '';
            
            // First check status
            const statusResult = await premiumApi.fetchPremiumStatus(token);
            const isPremium = statusResult.premium;
            
            // If premium, also fetch details
            if (isPremium) {
                const details = await premiumApi.fetchPremiumDetails(token);
                
                const premiumDetails = {
                    isPremium: details.isActive,
                    expiresAt: details.expires_at,
                    subscriptionType: details.subscription_type,
                    daysRemaining: details.daysRemaining,
                    status: details.status
                };
                
                setPremium(prev => ({
                    ...prev,
                    ...premiumDetails,
                    loading: false
                }));
                
                return premiumDetails;
            } else {
                setPremium(prev => ({ 
                    ...prev, 
                    isPremium: false,
                    loading: false
                }));
                
                return {
                    isPremium: false,
                    expiresAt: null,
                    subscriptionType: null,
                    daysRemaining: null,
                    status: null
                };
            }
        } catch (error) {
            console.error('Error fetching premium details:', error);
            
            setPremium(prev => ({ 
                ...prev, 
                isPremium: false,
                loading: false
            }));
            
            return {
                isPremium: false,
                expiresAt: null,
                subscriptionType: null,
                daysRemaining: null,
                status: null
            };
        }
    };
    
    const redeemCode = async (code: string): Promise<{ success: boolean; message: string }> => {
        try {
            const token = localStorage.getItem('hehe-token_state') || '';
            const result = await premiumApi.redeemCode(token, code);
            console.log(result);
            if (result.success) {
                // Refresh premium status
                await getPremiumDetails();
            }
            
            return result;
        } catch (error) {
            console.error('Error redeeming code:', error);
            return { success: false, message: 'An error occurred while redeeming the code' };
        }
    };
    
    const processPayment = async (paymentData: any): Promise<{ success: boolean; message: string }> => {
        if (!loginContext.isLoggedIn() || !loginContext.accessToken) {
            return { success: false, message: 'You must be logged in to process a payment' };
        }

        try {
            const token = localStorage.getItem('hehe-token_state') || '';
            const result = await premiumApi.processPayPalPayment(token, paymentData);
            
            if (result.success) {
                // Refresh premium status
                await getPremiumDetails();
            }
            
            return result;
        } catch (error) {
            console.error('Error processing payment:', error);
            return { success: false, message: 'An error occurred while processing the payment' };
        }
    };

    const updateProfilesList = async (newProfiles: Profile[]) => {
        try {
            // First save the profiles list to the server
            await saveProfiles(profile.guid, newProfiles.map(p => p.guid));
            // Then update local state
            setProfiles(newProfiles);
        } catch (error) {
            console.error('Error updating profiles list:', error);
            // Could add user notification here
        }
    };

    const appProfile = {
        ...profile,
        listProfiles,
        checkProfileName,
        setProfileName,
        createProfile,
        switchProfile,
        deleteProfile,
        setProfiles: updateProfilesList
    };
    
    const appPremium = {
        ...premium,
        checkPremiumStatus,
        getPremiumDetails,
        redeemCode,
        processPayment
    };

    return (
        <MantineProvider defaultColorScheme="auto" theme={theme}>
            <Notifications position="top-right" limit={5} />
            <ConfigContext.Provider value={appConfig}>
                <ProfileContext.Provider value={appProfile}>
                    <LoginContextContext.Provider value={appLogin}>
                        <ChatEmotesContext.Provider value={chatEmotes}>
                            <PremiumContext.Provider value={appPremium}>
                                <Router connectionStatus={connectionStatus} />
                            </PremiumContext.Provider>
                        </ChatEmotesContext.Provider>
                    </LoginContextContext.Provider>
                </ProfileContext.Provider>
            </ConfigContext.Provider>
        </MantineProvider>
    );
}
