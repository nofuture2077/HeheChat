import { useEffect, useRef, useState } from 'react';
import PubSub from 'pubsub-js';
import { Profile, DEFAULT_PROFILE } from './commons/profile';
import { ProfileContext } from './ApplicationContext';
import VisualAlertPlayer from './components/browsersource/VisualAlertPlayer';
import { AlertSystem } from './components/alerts/alertplayer';
import { initializeStoragePatches } from './commons/patches';

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

  // Run storage patches on app initialization
  useEffect(() => {
    initializeStoragePatches();
  }, []);

  useEffect(() => {
    // Initialize the worker
    backendWorkerRef.current = new Worker(new URL('./components/webworker/backendworker.ts', import.meta.url), { type: 'module' });

    // Set up message handler
    backendWorkerRef.current.onmessage = (event) => {
      const data = event.data;

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
        const profile = data.profile;
        setProfile(profile);
        AlertSystem.updateProfile(profile);
      }

      if (data.type === 'sharedata') {
        AlertSystem.initialize();
        const profile = data.profile;
        setProfile(profile);
        AlertSystem.updateProfile(profile);
        const channels = profile.config?.channels || [];
        if (!channels) {
          return;
        }
        AlertSystem.addNewChannels(channels);
        backendWorkerRef.current?.postMessage({ type: "SEND", data: { type: "subscribe", source: "Browsersource", token, channels: Object.fromEntries(channels.map((key: string) => [key, true])) }});
      }
      
      if (data.type === 'alert') {
        // Publish alert data
        PubSub.publish('ALERT_SHOW', data.data);
      }

      if (data.type === 'event' || data.type === 'replayevent') {
        const event = data.data;
        if (AlertSystem.shouldBePlayedInBrowsersource(event) || (preview && event.force)) {
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

  return (<ProfileContext.Provider value={profile}>
    <VisualAlertPlayer />
  </ProfileContext.Provider>);
   
}
