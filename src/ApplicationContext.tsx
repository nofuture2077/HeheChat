import { createContext } from 'react';
import { Config, DEFAULT_CONFIG } from '@/commons/config';
import { Profile, DEFAULT_PROFILE } from '@/commons/profile';
import { LoginContext, DEFAULT_LOGIN_CONTEXT } from '@/commons/login';
import { ChatEmotes, DEFAULT_CHAT_EMOTES } from '@/commons/emotes';

export const ChatEmotesContext = createContext<ChatEmotes>(DEFAULT_CHAT_EMOTES);
export const ConfigContext = createContext<Config>(DEFAULT_CONFIG);
export const LoginContextContext = createContext<LoginContext>(DEFAULT_LOGIN_CONTEXT);
export const ProfileContext = createContext<Profile>(DEFAULT_PROFILE);