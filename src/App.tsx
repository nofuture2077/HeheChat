import '@mantine/core/styles.css';
import { createTheme, MantineProvider, virtualColor } from '@mantine/core';
import { useState } from 'react';
import { Router } from './Router';
import { ChatConfigContext, ChatConfig, ChatConfigKey, load, store, LoginContext, DEFAULT_LOGIN_CONTEXT, DEFAULT_CHAT_CONFIG, getUserId} from './ApplicationContext'
import { StaticAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';


export default function App() {
  const [chatConfig, setChatConfig] = useState<ChatConfig>({...DEFAULT_CHAT_CONFIG, ...load()});
  const [loginContext, setLoginContext] = useState<LoginContext>(DEFAULT_LOGIN_CONTEXT);

  const updateChatConfig = (key: ChatConfigKey, value: any) => {
    setChatConfig((chatConfig) => {
      const newConfig = { ...chatConfig, [key]: value };
      store(newConfig);
      return newConfig;
    });
  }
  
  const setChannels = (value: string[]) => updateChatConfig('channels', value);
  const setIgnoredUsers = (value: string[]) => updateChatConfig('ignoredUsers', value);
  const setShowTimestamp = (value: boolean) => updateChatConfig('showTimestamp', value);
  const setShowProfilePicture = (value: boolean) => updateChatConfig('showProfilePicture', value);
  const setShowImportantBadges = (value: boolean) => updateChatConfig('showImportantBadges', value);
  const setShowSubBadges = (value: boolean) => updateChatConfig('showSubBadges', value);
  const setShowPredictions = (value: boolean) => updateChatConfig('showPredictions', value);
  const setShowOtherBadges = (value: boolean) => updateChatConfig('showOtherBadges', value);
  const getChatChannel = () => {
    if (chatConfig.channels.includes(chatConfig.chatChannel || '')) {
      return chatConfig.chatChannel;
    } else {
      if (chatConfig.channels.length == 0) {
        return;
      }
      const channel = chatConfig.channels[0];
      setChatChannel(channel);
      return channel;
    }
  }
  const setChatChannel = (value: string) => updateChatConfig('chatChannel', value);
  const setAccessToken = async (accessToken: string) => {
    setLoginContext((loginContext) => {
        const newContext = { ...loginContext, accessToken };
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
      return new ApiClient({ authProvider: getAuthProvider()});
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

  return (
    <MantineProvider defaultColorScheme="auto" theme={theme}>
      <ChatConfigContext.Provider value={{ ...chatConfig, setChannels, setIgnoredUsers, setShowTimestamp, setShowProfilePicture, setShowImportantBadges, setShowSubBadges, setShowPredictions, setShowOtherBadges, setChatChannel, getChatChannel }}>
        <LoginContext.Provider value={{...loginContext, setAccessToken, isLoggedIn, getAuthProvider, getApiClient}}>
          <Router />
        </LoginContext.Provider>
      </ChatConfigContext.Provider>
    </MantineProvider>
  );
}
