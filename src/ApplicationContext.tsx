import { createContext } from 'react';
import { Config, DEFAULT_CONFIG } from '@/commons/config';
import { Profile, DEFAULT_PROFILE } from '@/commons/profile';
import { LoginContext, DEFAULT_LOGIN_CONTEXT } from '@/commons/login';
import { ChatEmotes, DEFAULT_CHAT_EMOTES } from '@/commons/emotes';
import { Premium, DEFAULT_PREMIUM } from '@/commons/premium';
import { Music, DEFAULT_MUSIC } from '@/commons/music';

export const ChatEmotesContext = createContext<ChatEmotes>(DEFAULT_CHAT_EMOTES);
export const ConfigContext = createContext<Config>(DEFAULT_CONFIG);
export const LoginContextContext = createContext<LoginContext>(DEFAULT_LOGIN_CONTEXT);
export const ProfileContext = createContext<Profile>(DEFAULT_PROFILE);
export const PremiumContext = createContext<Premium>(DEFAULT_PREMIUM);
export const MusicContext = createContext<Music>(DEFAULT_MUSIC);
