import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { useDidUpdate } from '@mantine/hooks';
import { useEffect, useState, useRef } from 'react';
import { Router } from './Router';
import { ConfigContext, LoginContextContext, ChatEmotesContext, ProfileContext } from '@/ApplicationContext'
import { LoginContext, DEFAULT_LOGIN_CONTEXT } from '@/commons/login'
import { StaticAuthProvider } from '@twurple/auth';
import { ApiClient, HelixModeratedChannel, HelixUser } from '@twurple/api';
import { ConfigKey, MessageHandler } from './commons/config';
import { ChatEmotes, DEFAULT_CHAT_EMOTES } from './commons/emotes';
import { Profile, DEFAULT_PROFILE } from './commons/profile';
import { generateGUID } from './commons/helper';
import PubSub from 'pubsub-js';
import { SystemMessageMainType } from "@/commons/message";
import { theme } from '@/theme';
import { AlertSystem } from '@/components/alerts/alertplayer';
import _ from 'underscore';

window.addEventListener("click", () => {
    if (!AlertSystem.status()) {
        AlertSystem.initialize();
    } 
}); 

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

async function storeProfile(profile: Profile): Promise<any> {
    const token = localStorage.getItem('hehe-token_state') || '';
    return fetch(BASE_URL + "/profile?" + [["token", token].join("="), ["guid", profile.guid].join("=")].join("&"), {
        method: 'PUT',
        body: JSON.stringify(profile)
    });
}

async function loadProfileFromServer(guid: String): Promise<Profile> {
    const token = localStorage.getItem('hehe-token_state') || '';
    return fetch(BASE_URL + "/profile?" + [["token", token].join("="), ["guid", guid].join("=")].join("&")).then(res => res.json());
}

async function deleteProfileFromServer(guid: String): Promise<any> {
    const token = localStorage.getItem('hehe-token_state') || '';
    return fetch(BASE_URL + "/profile?" + [["token", token].join("="), ["guid", guid].join("=")].join("&"), {method: 'DELETE'});
}

async function loadProfilesFromServer(): Promise<{profiles: Profile[]}> {
    const token = localStorage.getItem('hehe-token_state') || '';
    return fetch(BASE_URL + "/profile/list?" + [["token", token].join("=")].join("&")).then(res => res.json());
}

async function loadProfiles(): Promise<{active?: string, profiles: string}> {
    const token = localStorage.getItem('hehe-token_state') || '';
    return fetch(BASE_URL + "/profiles/list?" + [["token", token].join("=")].join("&")).then(res => res.json());
}

async function saveProfiles(active: string, profiles: string[]): Promise<any> {
    const token = localStorage.getItem('hehe-token_state') || '';
    return fetch(BASE_URL + "/profiles/list?" + [["token", token].join("="), ["active", active].join("="), ["profiles", profiles.join(',')].join("=")].join("&"), {
        method: 'PUT'
    });
}

const onMessageHandlers: MessageHandler[] = [];
var onMessageHandlerIndex = 0;

export default function App() {
    const [loginContext, setLoginContext] = useState<LoginContext>(DEFAULT_LOGIN_CONTEXT);
    const [chatEmotes, setChatEmotes] = useState<ChatEmotes>(DEFAULT_CHAT_EMOTES);
    const [profile, setProfile] = useState<Profile>({...DEFAULT_PROFILE, guid: generateGUID()});
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const workerRef = useRef<Worker>();

    useDidUpdate(() => {
        if (!profile.guid) {
            console.error("Saving profile without guid", profile);
            return;
        }
        if (!profile.config.channels || !profile.config.channels.length) {
            return;
        }
        storeProfile(profile);
    }, [profile])

    useEffect(() => {
        loadProfiles().then(async (data) => {
            if (data.active) {
                const profileData = await loadProfileFromServer(data.active);
                setProfile(profileData);
                AlertSystem.updateConfig(profileData.config);
                const order = data.profiles.split(',').filter(x => x);
                loadProfilesFromServer().then(r => {
                    setProfiles(_.sortBy(r.profiles, item => order.indexOf(item.guid)) || [profileData]);
                });
            } else {
                AlertSystem.updateConfig(profile.config);
                setProfile(profile);
                setProfiles([profile]);
            }
        }, (err) => console.error(err));

        workerRef.current = new Worker(new URL('./components/webworker/webworker.ts', import.meta.url), { type: 'module' });

        PubSub.subscribe("WSSEND", (msg, data) => {
            data.state = localStorage.getItem('hehe-token_state') || '';
            workerRef.current!.postMessage({type: "SEND", data});
        });

        workerRef.current.addEventListener("message", (msg: MessageEvent) => {
            PubSub.publish("WS-" + msg.data.type, msg.data.data);
        });

        loadReceivedShares();

        return () => {
            const stopMessage = { type: 'STOP' };
            workerRef.current?.postMessage(stopMessage);
        }
    }, []);

    useEffect(() => {
        if (profiles.length) {
            saveProfiles(profile.guid, profiles.map(p => p.guid));
        }
    }, [profile, profiles]);

    useEffect(() => {
        const updatedArray = profiles.map(obj =>
            obj.guid === profile.guid ? profile : obj
        );
        setProfiles(updatedArray);
        AlertSystem.updateConfig(profile.config);
    }, [profile])

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
    const setRaidTargets = (value: string[]) => updateConfig('raidTargets', value);
    const setChatEnabled = (value: boolean) => updateConfig('chatEnabled', value);
    const setHideViewers = (value: boolean) => updateConfig('hideViewers', value);
    const setHideOwnViewers = (value: boolean) => updateConfig('hideOwnViewers', value);
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
        return !!loginContext.accessToken;
    }
    const getAuthProvider = () => {
        return new StaticAuthProvider(loginContext.clientId, loginContext.accessToken || '');
    };
    const getApiClient = () => {
        return new ApiClient({ authProvider: getAuthProvider() });
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
        onMessageHandlers.forEach(handler => {
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
        if (name.length > 12) {
            return false;
        }
        for (var i = 0; i < profiles.length;i++) {
            if (name.toLowerCase() === profile.name.toLowerCase()) {
                return false;
            }
        }
        return true;
    }

    const setProfileName = (name: string) => {
        setProfile((profile) => {
            const newProfile = { ...profile, name };
            return newProfile;
        });
    };

    const switchProfile = (guid: string) => {
        const p = profiles.find(p => p.guid === guid);
        if (p) {
            setProfile(p);
        }
    };

    const createProfile = (name: string) => {
        const guid = generateGUID();
        const newProfile = {...DEFAULT_PROFILE, name, guid};
        setProfile(newProfile);
        setProfiles(profiles => profiles.concat(newProfile));
    };

    const deleteProfile = (guid: string) => {
        deleteProfileFromServer(guid);
        setProfiles(profiles => profiles.filter(p => p.guid !== guid));
        setProfile(profiles[0])
    }

    const setSystemMessageInChat = (type: SystemMessageMainType, val: boolean) => {
        setProfile((profile) => {
            profile.config.systemMessageInChat[type] = val;
            return profile;
        });
    }

    const setDeactivatedAlerts = (id: string, val: boolean) => {
        setProfile((profile) => {
            profile.config.deactivatedAlerts[id] = val;
            return profile;
        });
    }

    const loadReceivedShares = async () => {
        const share = localStorage.getItem('hehe-token_state') || '';
        const data: {shares: string[]} = await fetch(BASE_URL + "/shares?state=" + share).then(res => res.json());
        updateConfig('receivedShares', data.shares);
    }

    const loadShares = async () => {
        const share = localStorage.getItem('hehe-token_state') || '';
        const data: {shares: string[]} = await fetch(BASE_URL + "/shares/get?state=" + share).then(res => res.json());
        updateConfig('shares', data.shares);
    }

    const setShares = async (value: string[]) => {
        const share = localStorage.getItem('hehe-token_state') || '';
        const data: {shares: string[]} = await fetch(BASE_URL + "/shares/set?state=" + share + "&channels=" + value.join(',')).then(res => res.json());
        updateConfig('shares', data.shares);
    }

    const setActivatedShares = (value: string[]) => updateConfig('activatedShares', value);

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
        getChatChannel,
        setFontSize,
        setModToolsEnabled,
        setRaidTargets,
        setPlayAlerts,
        setSystemMessageInChat,
        setDeactivatedAlerts,
        loadReceivedShares,
        setActivatedShares,
        setShares,
        setHideViewers,
        setHideOwnViewers,
        loadShares,
        onMessage,
        off,
        fireMessage
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

    const appProfile = {
        ...profile,
        listProfiles,
        checkProfileName,
        setProfileName,
        createProfile,
        switchProfile,
        deleteProfile,
        setProfiles
    }

    return (
        <MantineProvider defaultColorScheme="auto" theme={theme}>
            <ConfigContext.Provider value={appConfig}>
                <ProfileContext.Provider value={appProfile}>
                    <LoginContextContext.Provider value={appLogin}>
                        <ChatEmotesContext.Provider value={chatEmotes}>
                            <Router />
                        </ChatEmotesContext.Provider>
                    </LoginContextContext.Provider>
                </ProfileContext.Provider>
            </ConfigContext.Provider>
        </MantineProvider>
    );
}
