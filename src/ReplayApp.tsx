import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { useEffect, useRef, useState } from 'react';
import { Profile, DEFAULT_PROFILE } from './commons/profile';
import { ConfigContext, ProfileContext } from './ApplicationContext';
import { initializeStoragePatches } from './commons/patches';
import { theme } from './theme';
import { EventList } from './components/events/EventList';
import { AlertSystem } from '@/components/alerts/alertplayer';
import { version } from '../package.json';

export const REPLAY_APP_NAME = "Replay App";

interface ReplayAppProps {
  token: string | undefined;
}


export default function ReplayApp({ token }: ReplayAppProps) {
  const backendWorkerRef = useRef<Worker | undefined>(undefined);
  const [profile, setProfile] = useState<Profile>({...DEFAULT_PROFILE});

  // Run storage patches on app initialization
  useEffect(() => {
    initializeStoragePatches();
  }, []);

  useEffect(() => {
    // Initialize the worker
    backendWorkerRef.current = new Worker(new URL('./components/webworker/backendworker.ts', import.meta.url), { type: 'module' });

    backendWorkerRef.current.onmessage = (event) => {
      const data = event.data;

      if (data.type === 'sharedata') {
          const profile: Profile = data.profile;
          setProfile(profile);
          AlertSystem.updateProfile(profile);

          const channels = profile.config?.channels || [];
          backendWorkerRef.current?.postMessage({ type: "SEND", data: { 
            type: "subscribe", 
            source: REPLAY_APP_NAME, 
            profile: profile.guid,
            profileName: profile.name,
            version,
            token, 
            channels: Object.fromEntries(channels.map((key: string) => [key, true])) 
          }});
      }

      if (data.type === 'profile') {
        const profile = data.profile;
        setProfile(profile);
        AlertSystem.updateProfile(profile);
      }

      if (data.type === 'event') {
          const event = data.data;
          PubSub.publish("WS-event", event);
      }
    };

    const wssendSub = PubSub.subscribe("WSSEND", (msg, data) => {
        data.sink = token;
        backendWorkerRef.current?.postMessage({type: "SEND", data });
    });

    // Send initial subscription message
    backendWorkerRef.current.postMessage({
      type: 'SEND',
      data: {
        type: 'sink',
        source: REPLAY_APP_NAME,
        token
      }
    });


    return () => {
      if (backendWorkerRef.current) {
        backendWorkerRef.current.postMessage({ type: 'STOP' });
        backendWorkerRef.current.terminate();
      }
      PubSub.unsubscribe(wssendSub);
    };
  }, [token]);

  if (!profile.guid) {
    return null;
  }

  return (<MantineProvider defaultColorScheme="auto" theme={theme}>
  <ProfileContext.Provider value={profile}>
    <ConfigContext.Provider value={profile.config}>
      <EventList></EventList>
    </ConfigContext.Provider>
  </ProfileContext.Provider>
  </MantineProvider>);
   
}
