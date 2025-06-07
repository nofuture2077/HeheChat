import { useEffect, useRef, useState } from 'react';
import PubSub from 'pubsub-js';
import { Profile, DEFAULT_PROFILE } from './commons/profile';
import { ProfileContext, ChatEmotesContext } from './ApplicationContext';
import VisualAlertPlayer from './components/browsersource/VisualAlertPlayer';
import { ChatEmotes, DEFAULT_CHAT_EMOTES } from './commons/emotes';
import { AlertSystem } from './components/alerts/alertplayer';
import { BrowserSourceAlertStatusIndicator } from './components/alerts/BrowserSourceAlertStatusIndicator';
import { initializeStoragePatches } from './commons/patches';
import { useDocumentVisibility, useNetwork, useDidUpdate } from '@mantine/hooks';


interface BrowserSourceProps {
  token: string | undefined;
  preview: boolean;
}

window.addEventListener("click", () => {
  if (!AlertSystem.status()) {
      AlertSystem.initialize();
  } 
}); 

export default function BrowserSource({ token, preview }: BrowserSourceProps) {
  const backendWorkerRef = useRef<Worker>();
  const [profile, setProfile] = useState<Profile>({...DEFAULT_PROFILE});
  const [chatEmotes] = useState<ChatEmotes>(DEFAULT_CHAT_EMOTES);
  const documentVisible = useDocumentVisibility();
  const networkStatus = useNetwork();

  // Run storage patches on app initialization
  useEffect(() => {
    initializeStoragePatches();
  }, []);

  useDidUpdate(() => {
      if (!AlertSystem.status()) {
          AlertSystem.initialize();
      } 
  }, [documentVisible, networkStatus.online]);

  // Check and initialize AlertSystem every 5 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!AlertSystem.status()) {
        AlertSystem.initialize();
      }
    }, 5000); // 5 seconds interval

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

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

  useEffect(() => {
    // Initialize the worker
    backendWorkerRef.current = new Worker(new URL('./components/webworker/backendworker.ts', import.meta.url), { type: 'module' });

    // Set up message handler
    backendWorkerRef.current.onmessage = (event) => {
      const data = event.data;

      // Handle connection status updates
      if (data.type === 'connectionStatus') {
        setConnectionStatus({
          status: ['CONNECTING', 'CONNECTED', 'DISCONNECTED', 'RECONNECTING'][data.status] || 'UNKNOWN',
          reconnectAttempts: data.reconnectAttempts,
          lastHeartbeat: data.lastHeartbeat
        });
        return;
      }

      if (data.type === 'delayinfo') {
        backendWorkerRef.current?.postMessage({ type: "SEND", data: { type: "delayinfo", ttsExtra: localStorage.getItem('hehechat-ttsExtra'), jingleExtra: localStorage.getItem('hehechat-jingleExtra') }});
        return;
      }

      if (data.type === 'setdelay') {
        AlertSystem.setJingleExtra(data.data.jingleExtra);
        AlertSystem.setTTSExtra(data.data.ttsExtra);
        backendWorkerRef.current?.postMessage({ type: "SEND", data: { type: "setdelayresponse", ttsExtra: localStorage.getItem('hehechat-ttsExtra'), jingleExtra: localStorage.getItem('hehechat-jingleExtra') }});
        return;
      }

      if (data.type === 'profile') {
        const profile: Profile = data.profile;
        setProfile(profile);
        AlertSystem.updateProfile(profile);
        chatEmotes.update(profile.config.channels);
      }

      if (data.type === 'sharedata') {
        if (!AlertSystem.status()) {
            AlertSystem.initialize();
        } 
        const profile = data.profile;
        setProfile(profile);
        AlertSystem.updateProfile(profile);
        const channels = profile.config?.channels || [];
        if (!channels) {
          return;
        }
        AlertSystem.addNewChannels(channels);
        backendWorkerRef.current?.postMessage({ type: "SEND", data: { 
          type: "subscribe", 
          source: "Browsersource", 
          profile: profile.guid,
          profileName: profile.name,
          token, 
          channels: Object.fromEntries(channels.map((key: string) => [key, true])) 
        }});
      }
      
      if (data.type === 'alert') {
        // Publish alert data
        setTimeout(() => {
          PubSub.publish('ALERT_SHOW', data.data);
        }, profile.config.visualAlertDelay * 1000);
      }

      if (data.type === 'event' || data.type === 'replayevent') {
        const event = data.data;

        if ((AlertSystem.shouldBePlayedInBrowsersource(event) && !event.force) || (preview && event.force)) {
          AlertSystem.addEvent(event);
        }
      }

      if (data.type === 'alertConfig') {
        console.log('Alertconfig was updated for: ', data.channel);
        AlertSystem.loadAlertConfig([data.channel]);
      }
    };

    // Send initial subscription message
    backendWorkerRef.current.postMessage({
      type: 'SEND',
      data: {
        type: 'sink',
        source: 'Browsersource',
        token
      }
    });

    // Cleanup worker on unmount
    return () => {
      if (backendWorkerRef.current) {
        backendWorkerRef.current.postMessage({ type: 'STOP' });
        backendWorkerRef.current.terminate();
      }
    };
  }, [token]);

  // Force reconnection if network status changes or document becomes visible
  useEffect(() => {
    if (networkStatus.online && documentVisible && backendWorkerRef.current) {
      console.log("Network or visibility changed, forcing reconnection");
      backendWorkerRef.current.postMessage({ type: 'RECONNECT' });
    }
  }, [networkStatus.online, documentVisible]);

  return (<ProfileContext.Provider value={profile}>
    <ChatEmotesContext.Provider value={chatEmotes}>
      <VisualAlertPlayer />
      <BrowserSourceAlertStatusIndicator/>
    </ChatEmotesContext.Provider>
  </ProfileContext.Provider>);
}
