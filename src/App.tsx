import '@mantine/core/styles.css';
import { createTheme, MantineProvider, virtualColor } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Router } from './Router';
import { ConfigContext, LoginContextContext, ChatEmotesContext, ProfileContext } from '@/ApplicationContext'
import { LoginContext, DEFAULT_LOGIN_CONTEXT } from '@/commons/login'
import { StaticAuthProvider } from '@twurple/auth';
import { ApiClient, HelixModeratedChannel, HelixUser } from '@twurple/api';
import { Config, ConfigKey, DEFAULT_CONFIG, MessageHandler } from './commons/config';
import { ChatEmotes, DEFAULT_CHAT_EMOTES } from './commons/emotes';
import { Profile, DEFAULT_PROFILE } from './commons/profile';

function load(): Config {
    return JSON.parse(localStorage.getItem('chatConfig') || JSON.stringify(DEFAULT_CONFIG)) as Config;
}

function storeProfile(profile: Profile) {
    localStorage.setItem(['profile', profile.name.toLowerCase()].join('-'), JSON.stringify(profile));
}

function migrateToProfile() {
    const config = load();
    if (!localStorage.getItem('hehe-profile')) {
        localStorage.setItem('hehe-profile', 'default');
        localStorage.setItem('profile-default', JSON.stringify({ name: 'default', config }));
        localStorage.removeItem('chatConfig');
    }
}

const onMessageHandlers: MessageHandler[] = [];
var onMessageHandlerIndex = 0;

export default function App() {
    const [loginContext, setLoginContext] = useState<LoginContext>(DEFAULT_LOGIN_CONTEXT);
    const [chatEmotes, setChatEmotes] = useState<ChatEmotes>(DEFAULT_CHAT_EMOTES);
    const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);

    useEffect(() => {
        migrateToProfile();
        const profileName = localStorage.getItem('hehe-profile')!;
        loadProfile(profileName);
    }, []);

    const updateConfig = (key: ConfigKey, value: any) => {
        setProfile((profile) => {
            const newProfile = { ...profile, config: { ...profile.config, [key]: value } };
            storeProfile(newProfile);
            return newProfile;
        });
    }

    const setChannels = (value: string[]) => updateConfig('channels', value);
    const setIgnoredUsers = (value: string[]) => updateConfig('ignoredUsers', value);
    const setShowTimestamp = (value: boolean) => updateConfig('showTimestamp', value);
    const setShowProfilePicture = (value: boolean) => updateConfig('showProfilePicture', value);
    const setShowImportantBadges = (value: boolean) => updateConfig('showImportantBadges', value);
    const setShowSubBadges = (value: boolean) => updateConfig('showSubBadges', value);
    const setShowPredictions = (value: boolean) => updateConfig('showPredictions', value);
    const setShowOtherBadges = (value: boolean) => updateConfig('showOtherBadges', value);
    const setFontSize = (value: number) => updateConfig('fontSize', value);
    const setModToolsEnabled = (value: boolean) => updateConfig('modToolsEnabled', value);
    const setRaidTargets = (value: string[]) => updateConfig('raidTargets', value);
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

    const theme = createTheme({
        colors: {
            primary: virtualColor({
                name: 'primary',
                dark: 'orange',
                light: 'cyan',
            }),
        },
    });

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

    const loadProfile = (profileName: string): Profile | undefined => {
        const profileData = localStorage.getItem(['profile', profileName.toLowerCase()].join('-'));
        if (!profileData) {
            return;
        }
        const profile = JSON.parse(profileData) as Profile;
        localStorage.setItem('hehe-profile', profileName.toLowerCase());
        setProfile({...profile, config: {...DEFAULT_PROFILE.config, ...profile.config}});
        return profile;
    }

    const listProfiles = () => {
        const profiles: Profile[] = [];
        for (var i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('profile-')) {
                const profile = JSON.parse(localStorage.getItem(key) || '{}');
                profiles.push(profile);
            }
        }
        return profiles;
    }

    const checkProfileName = (name: string) => {
        if (!name) {
            return false;
        }
        if (name.length > 12) {
            return false;
        }
        const profiles = listProfiles();
        for (var i = 0; i < profiles.length;i++) {
            if (name.toLowerCase() === profile.name.toLowerCase()) {
                return false;
            }
        }
        return true;
    }

    const setProfileName = (name: string) => {
        const check = checkProfileName(name);
        if (!check) {
            return false;
        }
        const oldName = profile.name;
        setProfile((profile) => {
            const newProfile = { ...profile, name };
            storeProfile(newProfile);
            return newProfile;
        });
        switchProfile(name);
        localStorage.removeItem(['profile', oldName.toLowerCase()].join('-'));
        return true;
    };

    const switchProfile = (name: string) => loadProfile(name);

    const createProfile = (name: string) => {
        localStorage.setItem(['profile', name.toLowerCase()].join('-'), JSON.stringify({...DEFAULT_PROFILE, name}));
        switchProfile(name);
    };

    const deleteProfile = (profileName: string) => {
        if (profile.name.toLowerCase() === profileName.toLowerCase()) {
            const profiles = listProfiles();
            const newProfile = profiles.find(p => p.name.toLowerCase() !== profileName.toLowerCase());
            if (newProfile) {
                switchProfile(newProfile.name);
                localStorage.removeItem(['profile', profileName.toLowerCase()].join('-'));
            }
        } else {
            localStorage.removeItem(['profile', profileName.toLowerCase()].join('-'));
        }
    }

    const appConfig = {
        ...profile.config,
        setChannels,
        setIgnoredUsers,
        setShowTimestamp,
        setShowProfilePicture,
        setShowImportantBadges,
        setShowSubBadges,
        setShowPredictions,
        setShowOtherBadges,
        setChatChannel,
        getChatChannel,
        setFontSize,
        setModToolsEnabled,
        setRaidTargets,
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
        deleteProfile
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
