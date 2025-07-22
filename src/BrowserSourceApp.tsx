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

export default function BrowserSource({ token, preview }: BrowserSourceProps) {
  const backendWorkerRef = useRef<Worker>();
  const [profile, setProfile] = useState<Profile>({...DEFAULT_PROFILE});
  const [chatEmotes] = useState<ChatEmotes>(DEFAULT_CHAT_EMOTES);
  const documentVisible = useDocumentVisibility();
  const networkStatus = useNetwork();
  const initializationAttempted = useRef(false);
  const alertSystemCheckInterval = useRef<number>();

  // Run storage patches on app initialization
  useEffect(() => {
    initializeStoragePatches();
  }, []);

  // Initialize AlertSystem once on user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!initializationAttempted.current && !AlertSystem.status()) {
        console.log('Initializing AlertSystem on user interaction');
        AlertSystem.initialize();
        initializationAttempted.current = true;
      }
    };

    // Add event listeners for user interaction
    window.addEventListener("click", handleUserInteraction, { once: true });
    window.addEventListener("keydown", handleUserInteraction, { once: true });
    window.addEventListener("touchstart", handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("keydown", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
    };
  }, []);

  // Handle document visibility and network changes
  useDidUpdate(() => {
    if (documentVisible && networkStatus.online && initializationAttempted.current) {
      if (AlertSystem.interrupted()) {
        console.log('Attempting to resume AlertSystem after interruption');
        AlertSystem.initialize();
      }
    }
  }, [documentVisible, networkStatus.online]);

  // Periodic AlertSystem health check (less frequent)
  useEffect(() => {
    alertSystemCheckInterval.current = setInterval(() => {
      if (initializationAttempted.current && !AlertSystem.status() && !AlertSystem.interrupted()) {
        console.log('AlertSystem health check: reinitializing');
        AlertSystem.initialize();
      }
    }, 30000) as unknown as number; // Check every 30 seconds instead of 5

    return () => {
      if (alertSystemCheckInterval.current) {
        clearInterval(alertSystemCheckInterval.current);
      }
    };
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
    // Set the AlertSystem mode to browsersource
    AlertSystem.mode = 'browsersource';
    
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
        (profile.config.channels || []).forEach((channel: string) => {
            chatEmotes.updateChannel(channel);
        });
      }

      if (data.type === 'sharedata') {
        if (!AlertSystem.status()) {
            AlertSystem.initialize();
        } 
        const profile = data.profile;
        setProfile(profile);
        AlertSystem.updateProfile(profile);
        (profile.config.channels || []).forEach((channel: string) => {
            chatEmotes.updateChannel(channel);
        });
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

        const shouldPlayAudio = AlertSystem.shouldBePlayedInBrowsersourceAudio(event);
        const shouldShowVisual = AlertSystem.shouldBePlayedInBrowsersourceVisual(event);
        
        if (((shouldPlayAudio || shouldShowVisual) && !event.force) || (preview && event.force)) {
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
