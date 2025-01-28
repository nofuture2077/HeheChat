import { useEffect, useRef, useState } from 'react';
import PubSub from 'pubsub-js';
import { Profile, DEFAULT_PROFILE } from './commons/profile';
import { ProfileContext } from './ApplicationContext';
import VisualAlertPlayer from './components/browsersource/VisualAlertPlayer';
import { AlertSystem } from './components/alerts/alertplayer';

interface BrowserSourceProps {
  token: string | undefined;
}

window.addEventListener("click", () => {
  if (!AlertSystem.status()) {
      AlertSystem.initialize();
  } 
}); 

export default function BrowserSource({ token }: BrowserSourceProps) {
  const backendWorkerRef = useRef<Worker>();
  const [profile, setProfile] = useState<Profile>({...DEFAULT_PROFILE});

  useEffect(() => {
    // Initialize the worker
    backendWorkerRef.current = new Worker(new URL('./components/webworker/backendworker.ts', import.meta.url), { type: 'module' });

    // Set up message handler
    backendWorkerRef.current.onmessage = (event) => {
      const data = event.data;

      if (data.type === 'profile') {
        const profile = data.profile;
        setProfile(profile);
        AlertSystem.updateProfile(profile);
      }

      if (data.type === 'sharedata') {
        AlertSystem.initialize();
        const profile = data.profile;
        setProfile(profile);
        AlertSystem.updateProfile(profile);
        AlertSystem.alertConfig = data.shares;

        // Publish alert configs
        PubSub.publish('ALERT_CONFIG', data.shares);

        backendWorkerRef.current?.postMessage({ type: "SEND", data: { source: "Browsersource", channels: Object.fromEntries(profile.config.channels.map((key: string) => [key, true])) }});
      }
      
      if (data.type === 'alert') {
        // Publish alert data
        PubSub.publish('ALERT_SHOW', data.data);
      }

      if (data.type === 'event' || data.type === 'replayevent') {
        const event = data.data;
        if (AlertSystem.shouldBePlayedInBrowsersource(event)) {
          AlertSystem.addEvent(event);
        }
      }
    };

    // Send initial subscription message
    backendWorkerRef.current.postMessage({
      type: 'SEND',
      data: {
        type: 'sink',
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

  return (<ProfileContext.Provider value={profile}>
    <VisualAlertPlayer />
  </ProfileContext.Provider>);
   
}
