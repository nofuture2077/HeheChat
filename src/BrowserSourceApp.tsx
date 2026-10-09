import { useEffect, useRef, useState } from 'react';
import PubSub from 'pubsub-js';
import { Profile, DEFAULT_PROFILE } from './commons/profile';
import { ProfileContext, ChatEmotesContext } from './ApplicationContext';
import VisualAlertPlayer from './components/browsersource/VisualAlertPlayer';
import { ChatEmotes, DEFAULT_CHAT_EMOTES } from './commons/emotes';
import { AlertSystem } from './components/alerts/alertplayer';
import { BrowserSourceAlertStatusIndicator } from './components/alerts/BrowserSourceAlertStatusIndicator';
import { initializeStoragePatches } from './commons/patches';
import { useDocumentVisibility, useNetwork,  } from '@mantine/hooks';
import { version } from '../package.json';


interface BrowserSourceProps {
  token: string | undefined;
  preview: boolean;
  embed?: boolean;
}

const EDITOR_ORIGIN = (() => {
  try {
    return new URL(import.meta.env.VITE_EDITOR_URL).origin;
  } catch {
    return undefined;
  }
})();

export default function BrowserSource({ token, preview, embed = false }: BrowserSourceProps) {
  const backendWorkerRef = useRef<Worker | undefined>(undefined);
  const [profile, setProfile] = useState<Profile>({...DEFAULT_PROFILE});
  const [chatEmotes] = useState<ChatEmotes>(DEFAULT_CHAT_EMOTES);
  const documentVisible = useDocumentVisibility();
  const networkStatus = useNetwork();
  const initializationAttempted = useRef(false);
  const alertSystemCheckInterval = useRef<number | undefined>(undefined);
  // Embedded editor preview: channels whose alert config was pushed by the editor (unsaved draft)
  const previewOverrides = useRef<Set<string>>(new Set());
  const embedded = preview && embed && window.parent !== window;

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

  // Handle document visibility and network changes with debouncing
  useEffect(() => {
    let timeoutId: number;
    
    if (documentVisible && networkStatus.online && initializationAttempted.current) {
      if (AlertSystem.interrupted()) {
        // Debounce AlertSystem initialization to prevent excessive calls
        timeoutId = setTimeout(() => {
          console.log('Attempting to resume AlertSystem after interruption');
          AlertSystem.initialize();
        }, 500) as unknown as number; // Wait 500ms before initializing
      }
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
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

  useEffect(() => {
    // Set the AlertSystem mode to browsersource
    AlertSystem.mode = 'browsersource';
    
    // Initialize the worker
    backendWorkerRef.current = new Worker(new URL('./components/webworker/backendworker.ts', import.meta.url), { type: 'module' });

    // Set up message handler
    backendWorkerRef.current.onmessage = (event) => {
      const data = event.data;

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
          version,
          token, 
          channels: Object.fromEntries(channels.map((key: string) => [key, true])) 
        }});
      }
      
      // The embedded editor preview only plays what the editor sends via postMessage
      if (embedded && (data.type === 'alert' || data.type === 'event' || data.type === 'replayevent')) {
        return;
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
        
        // Only process events if browserSourceAudio is true (meaning browsersource handles its own processing)
        // If browserSourceAudio is false, the main app will send pre-processed alerts via 'alert' type
        if (profile.config.browserSourceAudio && (((shouldPlayAudio || shouldShowVisual) && !event.force) || (preview && event.force))) {
          AlertSystem.addEvent(event);
        }
      }

      if (data.type === 'alertConfig') {
        if (previewOverrides.current.has(data.channel)) {
          return;
        }
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

  // Editor preview bridge: the alert editor embeds this page in an iframe and drives it via postMessage
  useEffect(() => {
    if (!embedded || !EDITOR_ORIGIN) {
      return undefined;
    }

    const postToEditor = (message: Record<string, unknown>) => {
      window.parent.postMessage(message, EDITOR_ORIGIN);
    };

    const ensureAudio = () => {
      if (!AlertSystem.status()) {
        AlertSystem.initialize();
        initializationAttempted.current = true;
      }
      postToEditor({ type: 'hehe-preview:status', audio: AlertSystem.status(), connected: !!AlertSystem.config });
    };

    // Static alert shown while editing; restored after a played test alert has finished
    let stickyAlert: Record<string, unknown> | null = null;
    const showSticky = () => {
      if (stickyAlert) {
        PubSub.publish('ALERT_SHOW', { ...stickyAlert, triggerId: undefined, duration: 2_000_000_000 });
      }
    };
    const hiddenToken = PubSub.subscribe('ALERT_HIDDEN', showSticky);

    const handleMessage = (ev: MessageEvent) => {
      if (ev.origin !== EDITOR_ORIGIN || !ev.data || typeof ev.data.type !== 'string') {
        return;
      }
      const msg = ev.data;

      switch (msg.type) {
        case 'hehe-preview:config':
          if (msg.channel && msg.config) {
            previewOverrides.current.add(msg.channel);
            AlertSystem.alertConfig[msg.channel] = msg.config;
          }
          break;
        case 'hehe-preview:event':
          if (msg.event) {
            ensureAudio();
            AlertSystem.addEvent({ ...msg.event, force: true });
          }
          break;
        case 'hehe-preview:show':
          if (msg.alert) {
            stickyAlert = msg.alert;
            showSticky();
          }
          break;
        case 'hehe-preview:clear':
          stickyAlert = null;
          PubSub.publish('ALERT_HIDE');
          break;
      }
    };

    // A click inside the embedded preview always (re)starts audio, even after a failed autoplay attempt
    const handleClick = () => {
      ensureAudio();
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('click', handleClick);
    postToEditor({ type: 'hehe-preview:ready' });

    const statusInterval = setInterval(() => {
      postToEditor({ type: 'hehe-preview:status', audio: AlertSystem.status(), connected: !!AlertSystem.config });
    }, 1000);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('click', handleClick);
      PubSub.unsubscribe(hiddenToken);
      clearInterval(statusInterval);
    };
  }, [embedded]);

  // Force reconnection if network status changes or document becomes visible
  useEffect(() => {
    let timeoutId: number;
    
    if (networkStatus.online && documentVisible && backendWorkerRef.current) {
      // Debounce reconnection attempts to prevent excessive calls
      timeoutId = setTimeout(() => {
        console.log("Network or visibility changed, forcing reconnection");
        backendWorkerRef.current?.postMessage({ type: 'RECONNECT' });
      }, 1000) as unknown as number; // Wait 1 second before reconnecting
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [networkStatus.online, documentVisible]);

  return (<ProfileContext.Provider value={profile}>
    <ChatEmotesContext.Provider value={chatEmotes}>
      <VisualAlertPlayer />
      <BrowserSourceAlertStatusIndicator/>
    </ChatEmotesContext.Provider>
  </ProfileContext.Provider>);
}
